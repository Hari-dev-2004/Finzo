from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import random
import logging
from rest_framework import serializers
from django.core.mail import EmailMessage
from django.contrib.auth import get_user_model, login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import OTP, FinancialProfile, UserRecommendation, CustomUser, MarketData, CommunityGroup, GroupMembership, GroupMessage, Post, Comment, Event, Hashtag, UserFollow, Course, Enrollment, UserProgress
from .serializers import RegisterSerializer, LoginSerializer, OTPSendSerializer, OTPVerifySerializer, FinancialProfileSerializer, UserProfileSerializer, FinancialProfileUpdateSerializer, CommunityGroupSerializer, CommunityGroupDetailSerializer, GroupMessageSerializer, PostSerializer, PostDetailSerializer, CommentSerializer, CommentWithRepliesSerializer, EventSerializer, UserBriefSerializer, UserFollowSerializer, CourseSerializer, CourseDetailSerializer
from django.core.cache import cache
from django.http import JsonResponse
from .research import *
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.cache import cache_page
from .recommendation_system import (
    generate_recommendations, 
    generate_stock_recommendations,
    generate_mutual_fund_recommendations,
    generate_all_recommendations,
    generate_portfolio_guidance
)
from .research import get_top_gainers_losers, get_index_data
from django.core.management import call_command
from django.db.models import F, Q, Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, filters
from rest_framework.decorators import action
import os
import shutil
import json

User = get_user_model()
logger = logging.getLogger(__name__)

def generate_recommendations_for_user(user, financial_profile, rec_type):
    """
    Helper function to generate recommendations for a specific user and type
    """
    try:
        logger.info(f"Generating {rec_type} recommendations for user {user.email}")
        
        # Convert financial profile to dictionary format
        profile_dict = {
            'monthly_income': float(financial_profile.monthly_income),
            'monthly_expenses': float(financial_profile.monthly_expenses),
            'current_savings': float(financial_profile.current_savings),
            'existing_investments': float(financial_profile.existing_investments),
            'current_debt': float(financial_profile.current_debt) if financial_profile.current_debt else 0,
            'investment_time_horizon': financial_profile.investment_time_horizon,
            'risk_tolerance': financial_profile.risk_tolerance,
            'financial_goals': financial_profile.financial_goals
        }
        
        success = False
        if rec_type == 'STOCKS':
            # Generate stock recommendations directly
            result = generate_stock_recommendations(profile_dict)
            if result['status'] == 'success' and 'recommendations' in result:
                stocks = result['recommendations']
                UserRecommendation.objects.update_or_create(
                    user=user,
                    recommendation_type='STOCKS',
                    defaults={
                        'recommendations': stocks,
                        'status': 'completed',
                        'updated_at': timezone.now()
                    }
                )
                success = True
        elif rec_type == 'MUTUAL_FUNDS':
            # Generate mutual fund recommendations directly
            result = generate_mutual_fund_recommendations(profile_dict)
            if result['status'] == 'success' and 'recommendations' in result:
                funds = result['recommendations']
                UserRecommendation.objects.update_or_create(
                    user=user,
                    recommendation_type='MUTUAL_FUNDS',
                    defaults={
                        'recommendations': funds,
                        'status': 'completed',
                        'updated_at': timezone.now()
                    }
                )
                success = True
        elif rec_type in ['SIP', 'FIXED_INCOME']:
            # Generate all recommendations and extract the specific type
            result = generate_all_recommendations(profile_dict)
            if result['status'] == 'success' and 'recommendations' in result:
                if rec_type == 'SIP' and 'sip' in result['recommendations']:
                    sip_recs = result['recommendations']['sip']
                    UserRecommendation.objects.update_or_create(
                        user=user,
                        recommendation_type='SIP',
                        defaults={
                            'recommendations': sip_recs,
                            'status': 'completed',
                            'updated_at': timezone.now()
                        }
                    )
                    success = True
                elif rec_type == 'FIXED_INCOME' and 'fixed_income' in result['recommendations']:
                    fixed_income_recs = result['recommendations']['fixed_income']
                    UserRecommendation.objects.update_or_create(
                        user=user,
                        recommendation_type='FIXED_INCOME',
                        defaults={
                            'recommendations': fixed_income_recs,
                            'status': 'completed',
                            'updated_at': timezone.now()
                        }
                    )
                    success = True
        else:
            logger.error(f"Unknown recommendation type: {rec_type}")
            return False
            
        if success:
            logger.info(f"Successfully generated {rec_type} recommendations for user {user.email}")
            return True
        else:
            logger.error(f"Failed to generate {rec_type} recommendations for user {user.email}")
            # Update the recommendation status to failed
            UserRecommendation.objects.update_or_create(
                user=user,
                recommendation_type=rec_type,
                defaults={
                    'recommendations': [],
                    'status': 'failed',
                    'error_message': 'Failed to generate recommendations',
                    'updated_at': timezone.now()
                }
            )
            return False
    except Exception as e:
        logger.error(f"Error generating {rec_type} recommendations for user {user.email}: {e}")
        # Update the recommendation status to failed
        UserRecommendation.objects.update_or_create(
            user=user,
            recommendation_type=rec_type,
            defaults={
                'recommendations': [],
                'status': 'failed',
                'error_message': str(e),
                'updated_at': timezone.now()
            }
        )
        return False

def generate_and_send_otp(email):
    """Generate and send OTP with enhanced error handling"""
    try:
        # Generate 6-digit OTP
        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=5)

        # Save or update OTP record
        OTP.objects.update_or_create(
            email=email,
            defaults={'otp': otp_code, 'expires_at': expires_at}
        )

        # Create email message
        subject = "Your Finzo Verification Code"
        message = f"""Your Finzo account verification code is:
        
{otp_code}

This code will expire in 5 minutes."""
        
        email_msg = EmailMessage(
            subject,
            message,
            "Finzo Support <finzocap@gmail.com>",
            [email],
        )
        email_msg.send(fail_silently=False)
        logger.info(f"OTP sent successfully to {email}")
        return (otp_code, expires_at)
    except Exception as e:
        logger.error(f"Failed to send OTP to {email}: {str(e)}", exc_info=True)
        raise

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        try:
            generate_and_send_otp(user.email)
            return Response(
                {
                    "detail": "Registration successful! Please check your email.",
                    "email": user.email
                },
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Registration succeeded but OTP failed for {user.email}")
            return Response(
                {
                    "detail": "Account created but verification email failed.",
                    "email": user.email,
                    "error": "OTP_SEND_FAILED"
                },
                status=status.HTTP_201_CREATED
            )

class LoginView(APIView):
    def post(self, request, format=None):
        try:
            # Log the login attempt
            phone_number = request.data.get('phone_number', 'not provided')
            logger.info(f"Login attempt with phone: {phone_number}")
            
            serializer = LoginSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.validated_data['user']
            
            if not user.is_verified:
                logger.warning(f"Login failed for {phone_number}: Account not verified")
                return Response(
                    {"detail": "Account not verified. Check your email."},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Log the user in using Django's session framework
            login(request, user)

            # Continue issuing JWT tokens if needed
            refresh = RefreshToken.for_user(user)
            logger.info(f"Login successful for {phone_number}")
            return Response({
                "detail": "Login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_verified": user.is_verified,
                    "has_completed_financial_info": user.has_completed_financial_info,
                    "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
                }
            }, status=status.HTTP_200_OK)
            
        except serializers.ValidationError as e:
            # Log validation errors specifically
            phone_number = request.data.get('phone_number', 'not provided')
            error_detail = str(e.detail if hasattr(e, 'detail') else e)
            logger.error(f"Login validation error for {phone_number}: {error_detail}")
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Log any other errors
            phone_number = request.data.get('phone_number', 'not provided')
            logger.error(f"Login error for {phone_number}: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"detail": "Authentication failed"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class SendEmailOTPView(APIView):
    """Handle OTP resend requests with validation"""
    def post(self, request, format=None):
        try:
            serializer = OTPSendSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            
            # Verify user exists before sending OTP
            if not User.objects.filter(email=email).exists():
                return Response(
                    {"detail": "No account found with this email."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            generate_and_send_otp(email)
            return Response(
                {"detail": "Verification code has been resent."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"OTP resend failed: {str(e)}")
            return Response(
                {"detail": "Failed to resend verification code."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class VerifyEmailOTPView(APIView):
    """Handle OTP verification with JWT return"""
    def post(self, request, format=None):
        try:
            serializer = OTPVerifySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            otp_input = serializer.validated_data['otp']

            otp_record = OTP.objects.get(email=email)
            
            if otp_record.is_expired():
                otp_record.delete()
                return Response(
                    {"detail": "Expired verification code."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if otp_record.otp != otp_input:
                return Response(
                    {"detail": "Incorrect verification code."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            otp_record.delete()
            user = User.objects.get(email=email)
            user.is_verified = True
            user.save()

            refresh = RefreshToken.for_user(user)
            return Response({
                "detail": "Account verified successfully!",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "is_verified": user.is_verified,
                    "has_completed_financial_info": user.has_completed_financial_info,
                    "profile_picture": request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
                }
            }, status=status.HTTP_200_OK)

        except OTP.DoesNotExist:
            return Response(
                {"detail": "No verification code found."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User account not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Verification error: {str(e)}")
            return Response(
                {"detail": "Verification process failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
class FinancialProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Check if existing_investments is provided
        if 'existing_investments' not in request.data:
            return Response(
                {"existing_investments": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Use FinancialProfileUpdateSerializer for validation
        serializer = FinancialProfileUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                FinancialProfile.objects.update_or_create(
                    user=user,
                    defaults=serializer.validated_data
                )
                if not user.has_completed_financial_info:
                    user.has_completed_financial_info = True
                    user.save()
                return Response({"detail": "Profile updated"}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Error updating financial profile: {str(e)}")
                return Response(
                    {"detail": f"Failed to update profile: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        try:
            profile = FinancialProfile.objects.get(user=request.user)
            # Use FinancialProfileSerializer for GET requests to return all fields
            serializer = FinancialProfileSerializer(profile)
            return Response(serializer.data)
        except FinancialProfile.DoesNotExist:
            return Response(
                {"detail": "Financial profile not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username=None):
        if username:
            try:
                user = CustomUser.objects.get(username=username)
                serializer = UserProfileSerializer(user, context={'request': request})
                return Response(serializer.data)
            except CustomUser.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Return current user's profile
            serializer = UserProfileSerializer(request.user, context={'request': request})
            return Response(serializer.data)

    def patch(self, request):
        user = request.user
        
        # Only allow updating certain fields
        allowed_fields = ['first_name', 'last_name', 'bio', 'profile_picture', 'phone_number', 'email']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = UserProfileSerializer(user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def search_stocks(request):
    """Modified from Flask version"""
    query = request.GET.get('query', '').upper()
    try:
        stocks = get_nse_stock_list()
        filtered = stocks[stocks['symbol'].str.startswith(query) | 
                        stocks['companyName'].str.contains(query, case=False)]
        return JsonResponse(filtered.head(10).to_dict('records'), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['GET'])
def analyze_stock(request):
    symbol = request.GET.get('symbol', '')
    try:
        cache_key = f'stock_analysis_{symbol}'
        if cached := cache.get(cache_key):
            return JsonResponse(cached)

        # Call the functions from research.py
        price_data = get_stock_price_data(symbol)
        if price_data is None or price_data.empty:
            return JsonResponse({'error': 'No data'}, status=404)

        fundamentals, info = get_fundamental_data(symbol)
        analysis = analyze_stock_health(price_data, fundamentals, info)
        news = get_stock_news(symbol)
        # charts = generate_charts(price_data, analysis)  # if applicable

        response = {
            'symbol': symbol,
            'company_name': info.get('shortName', symbol),
            'current_price': analysis.get('current_price'),
            'health_score': analysis.get('health_score'),
            'technical_score': analysis.get('technical_score'),
            'fundamental_score': analysis.get('fundamental_score'),
            'recommendation': analysis.get('recommendation'),
            'entry_point': analysis.get('entry_point'),
            'exit_point': analysis.get('exit_point'),
            'signals': analysis.get('signals'),
            'fundamentals': fundamentals,
            # 'charts': charts,
            'news': news
        }
        cache.set(cache_key, response, 14400)
        return JsonResponse(response)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    
@api_view(['GET'])
@cache_page(60 * 15)  # Cache for 15 minutes
def get_commodity(request):
    ticker = request.GET.get('ticker', 'GC=F')
    period = request.GET.get('period', '1y')
    try:
        data = get_commodity_data(ticker, period)
        if data is not None:
            return JsonResponse(data.reset_index().to_dict(orient='list'), safe=False)
        return JsonResponse({'error': 'No data found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@cache_page(60 * 15)
def get_mutual_fund(request):
    ticker = request.GET.get('ticker', '0P0000XVPM.BO')  # Example MF ticker
    period = request.GET.get('period', '1y')
    try:
        data = get_mutual_fund_data(ticker, period)
        if data is not None:
            return JsonResponse(data.reset_index().to_dict(orient='list'), safe=False)
        return JsonResponse({'error': 'No data found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@cache_page(60 * 10)
def random_stocks(request):
    try:
        n = int(request.GET.get('n', 6))
        data = get_random_stocks(n)
        serialized = {k: v.reset_index().to_dict(orient='list') for k,v in data.items()}
        return JsonResponse(serialized)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
@cache_page(60 * 30)  # Cache for 30 minutes
def gainers_losers(request):
    try:
        sample_size = int(request.GET.get('sample_size', 50))
        # Modified function to return more data (symbol, change percentage, price, volume)
        gainers, losers = get_top_gainers_losers(sample_size)
        return JsonResponse({
            'gainers': gainers,
            'losers': losers
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 

@api_view(['GET'])
@cache_page(60 * 60)  # Cache for 1 hour
def index_data(request):
    index_symbol = request.GET.get('index', '^NSEI')  # Default to Nifty 50
    period = request.GET.get('period', '1d')
    interval = request.GET.get('interval', '5m')  # Default to 5-minute intervals

    try:
        data = get_index_data(index_symbol, period=period, interval=interval)
        if data is not None and not data.empty:
            return JsonResponse(data.reset_index().to_dict(orient='list'), safe=False)
        return JsonResponse({'error': 'No data found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_recommendations(request):
    """
    Test endpoint for investment recommendations
    """
    try:
        # Create a sample financial profile for testing
        sample_profile = {
            'monthly_income': 50000.0,
            'monthly_expenses': 30000.0,
            'current_savings': 100000.0,
            'existing_investments': 200000.0,
            'current_debt': 50000.0,
            'risk_tolerance': 'moderate',
            'investment_time_horizon': '5 years',
            'financial_goals': 'Retirement, Home Purchase'
        }
        
        # Generate test recommendations using the sample profile
        result = generate_all_recommendations(sample_profile)
        
        # Add portfolio guidance
        if result['status'] == 'success' and 'recommendations' in result:
            result['recommendations']['portfolio_guidance'] = generate_portfolio_guidance(sample_profile)
            
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_investment_recommendations(request):
    """
    Generate personalized investment recommendations based on user's financial profile
    """
    try:
        # Get the user's financial profile
        try:
            financial_profile = FinancialProfile.objects.get(user=request.user)
        except FinancialProfile.DoesNotExist:
            return Response(
                {'error': 'Financial profile not found. Please complete your profile first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Convert model to dictionary
        profile_dict = {
            'monthly_income': float(financial_profile.monthly_income),
            'monthly_expenses': float(financial_profile.monthly_expenses),
            'current_savings': float(financial_profile.current_savings),
            'existing_investments': float(financial_profile.existing_investments),
            'current_debt': float(financial_profile.current_debt) if financial_profile.current_debt else 0,
            'risk_tolerance': financial_profile.risk_tolerance,
            'investment_time_horizon': financial_profile.investment_time_horizon,
            'financial_goals': financial_profile.financial_goals
        }
        
        # Generate recommendations
        result = generate_all_recommendations(profile_dict)
        
        # Add portfolio guidance 
        if result['status'] == 'success' and 'recommendations' in result:
            result['recommendations']['portfolio_guidance'] = generate_portfolio_guidance(profile_dict)
        
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    """
    Dashboard endpoint that returns user profile and investment recommendations
    """
    try:
        # Get user profile data
        user = request.user
        profile_data = {
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_verified': user.is_verified,
            'has_completed_financial_info': user.has_completed_financial_info
        }
        
        # Get financial profile and recommendations if available
        recommendations = None
        try:
            financial_profile = FinancialProfile.objects.get(user=user)
            
            # Only generate recommendations if financial profile is complete
            if user.has_completed_financial_info:
                # Convert model to dictionary
                profile_dict = {
                    'monthly_income': float(financial_profile.monthly_income),
                    'monthly_expenses': float(financial_profile.monthly_expenses),
                    'current_savings': float(financial_profile.current_savings),
                    'existing_investments': float(financial_profile.existing_investments),
                    'current_debt': float(financial_profile.current_debt) if financial_profile.current_debt else 0,
                    'risk_tolerance': financial_profile.risk_tolerance,
                    'investment_time_horizon': financial_profile.investment_time_horizon,
                    'financial_goals': financial_profile.financial_goals
                }
                
                # Use generate_all_recommendations which handles data fetching internally
                result = generate_all_recommendations(profile_dict)
                
                # Add portfolio guidance
                if result['status'] == 'success' and 'recommendations' in result:
                    recommendations = result['recommendations']
                    
                    # Add portfolio guidance
                    recommendations['portfolio_guidance'] = generate_portfolio_guidance(profile_dict)
                    
                # Alternatively, check if user has saved recommendations in the database
                if not recommendations:
                    saved_recs = UserRecommendation.objects.filter(
                        user=user, 
                        status='completed'
                    ).order_by('-updated_at')
                    
                    if saved_recs.exists():
                        recommendations = {}
                        for rec in saved_recs:
                            rec_type = rec.recommendation_type.lower()
                            recommendations[rec_type] = rec.recommendations
        except FinancialProfile.DoesNotExist:
            # User hasn't completed financial profile yet
            pass
        
        # Get market data for dashboard
        market_data = {}
        try:
            # Get top gainer and loser
            market_movers = get_top_gainers_losers(2)
            if market_movers and 'gainers' in market_movers and len(market_movers['gainers']) > 0:
                top_gainer = market_movers['gainers'][0]
            else:
                top_gainer = None
                
            if market_movers and 'losers' in market_movers and len(market_movers['losers']) > 0:
                top_loser = market_movers['losers'][0]
            else:
                top_loser = None
            
            # Get index data
            nifty_data = get_index_data('^NSEI')
            sensex_data = get_index_data('^BSESN')
            
            market_data = {
                'top_gainer': top_gainer,
                'top_loser': top_loser,
                'nifty': nifty_data,
                'sensex': sensex_data
            }
        except Exception as e:
            logger.error(f"Error fetching market data for dashboard: {e}")
            market_data = {}
        
        # Prepare response
        response_data = {
            'user_profile': profile_data,
            'market_data': market_data
        }
        
        # Add recommendations if available
        if recommendations:
            # Limit recommendations for dashboard view
            dashboard_recommendations = {
                'portfolio_guidance': recommendations.get('portfolio_guidance', {}),
                'stocks': recommendations.get('stocks', [])[:5],  # Top 5 stocks
                'mutual_funds': recommendations.get('mutual_funds', [])[:3],  # Top 3 mutual funds
                'sip': recommendations.get('sip', [])[:3],  # Top 3 SIPs
                'investment_capacity': recommendations.get('investment_capacity', {})
            }
            response_data['recommendations'] = dashboard_recommendations
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_recommendations(request):
    """
    Get all saved recommendations for the current user
    """
    try:
        # Get recommendation type parameter (optional)
        rec_type = request.GET.get('type', None)
        
        # Get user recommendations from database
        if rec_type:
            # Query for a specific recommendation type
            recommendations = UserRecommendation.objects.filter(
                user=request.user,
                recommendation_type=rec_type.upper()
            )
        else:
            # Get all recommendation types
            recommendations = UserRecommendation.objects.filter(
                user=request.user
            )
            
        # Format the response
        response_data = {}
        
        for recommendation in recommendations:
            rec_type = recommendation.recommendation_type.lower()
            response_data[rec_type] = {
                'data': recommendation.recommendations,
                'last_updated': recommendation.updated_at
            }
            
        # If no recommendations were found
        if not response_data:
            if rec_type:
                return Response(
                    {'message': f'No {rec_type} recommendations found for your profile'},
                    status=status.HTTP_404_NOT_FOUND
                )
            else:
                return Response(
                    {'message': 'No recommendations found for your profile'},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        return Response(response_data)
            
    except Exception as e:
        logger.error(f"Error retrieving user recommendations: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_user_recommendation(request):
    """
    Force refresh a specific type of recommendation for the current user
    """
    try:
        # Get the recommendation type from request data
        rec_type = request.data.get('type', '').upper()
        if not rec_type:
            return Response(
                {'error': 'Recommendation type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate recommendation type
        valid_types = ['STOCKS', 'MUTUAL_FUNDS', 'SIP', 'FIXED_INCOME', 'ALL']
        if rec_type not in valid_types:
            return Response(
                {'error': f'Invalid recommendation type. Must be one of: {", ".join(valid_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get user's financial profile
        try:
            profile = FinancialProfile.objects.get(user=request.user)
        except FinancialProfile.DoesNotExist:
            return Response(
                {'error': 'Financial profile not found. Please complete your profile first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Use the management command to handle recommendations
        import io
        from contextlib import redirect_stdout
        
        # Capture the output of the command
        output = io.StringIO()
        with redirect_stdout(output):
            if rec_type == 'ALL':
                call_command('refresh_recommendations', user_id=request.user.id, all=True)
            else:
                call_command('refresh_recommendations', user_id=request.user.id, type=rec_type)
        
        command_output = output.getvalue()
        logger.info(f"Command output: {command_output}")
            
        # Get the updated recommendations
        if rec_type == 'ALL':
            recommendations = UserRecommendation.objects.filter(user=request.user)
            response_data = {}
            
            for recommendation in recommendations:
                rec_type = recommendation.recommendation_type.lower()
                response_data[rec_type] = {
                    'data': recommendation.recommendations,
                    'last_updated': recommendation.updated_at
                }
            
            return Response({
                'message': 'All recommendations refreshed successfully',
                'data': response_data
            })
        else:
            try:
                recommendation = UserRecommendation.objects.get(
                    user=request.user,
                    recommendation_type=rec_type
                )
                
                return Response({
                    'message': f'{rec_type} recommendations refreshed successfully',
                    'data': recommendation.recommendations,
                    'last_updated': recommendation.updated_at
                })
            except UserRecommendation.DoesNotExist:
                return Response(
                    {'error': f'Failed to generate {rec_type} recommendations'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
    except Exception as e:
        logger.error(f"Error refreshing user recommendation: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily commented out for debugging
def get_recommendation_details(request):
    """
    Get detailed explanation for a specific stock or mutual fund recommendation
    """
    try:
        # Get parameters
        rec_type = request.GET.get('type', '').upper()
        symbol = request.GET.get('symbol', '')
        
        if not rec_type or not symbol:
            return Response(
                {'error': 'Both recommendation type and symbol are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Validate recommendation type
        valid_types = ['STOCKS', 'MUTUAL_FUNDS', 'SIP', 'FIXED_INCOME']
        if rec_type not in valid_types:
            return Response(
                {'error': f'Invalid recommendation type. Must be one of: {", ".join(valid_types)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the user's financial profile
        try:
            financial_profile = FinancialProfile.objects.get(user=request.user)
        except FinancialProfile.DoesNotExist:
            return Response(
                {'error': 'Financial profile not found. Please complete your financial profile first by providing all required information including existing investments.'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if recommendation exists and generate if needed
        try:
            recommendation = UserRecommendation.objects.get(
                user=request.user,
                recommendation_type=rec_type
            )
            
            # If recommendation exists but is empty, generate new ones
            if not recommendation.recommendations or recommendation.status != 'completed':
                logger.info(f"Empty or incomplete recommendations found for user {request.user.email}, type {rec_type}. Generating new ones.")
                generate_recommendations_for_user(request.user, financial_profile, rec_type)
                # Refresh after generation
                recommendation = UserRecommendation.objects.get(
                    user=request.user,
                    recommendation_type=rec_type
                )
        except UserRecommendation.DoesNotExist:
            # No recommendations found, generate them
            logger.info(f"No recommendations found for user {request.user.email}, type {rec_type}. Generating new ones.")
            generate_recommendations_for_user(request.user, financial_profile, rec_type)
            
            # Now try to get the newly generated recommendations
            try:
                recommendation = UserRecommendation.objects.get(
                    user=request.user,
                    recommendation_type=rec_type
                )
            except UserRecommendation.DoesNotExist:
                # Still no recommendations - something went wrong
                return Response(
                    {'error': f'Failed to generate {rec_type.lower()} recommendations. Please try refreshing your recommendations.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Format financial profile for the response
        profile_summary = {
            'risk_tolerance': financial_profile.risk_tolerance.lower(),
            'investment_time_horizon': financial_profile.investment_time_horizon.lower(),
            'monthly_income': float(financial_profile.monthly_income),
            'monthly_expenses': float(financial_profile.monthly_expenses),
            'current_savings': float(financial_profile.current_savings),
            'current_debt': float(financial_profile.current_debt) if financial_profile.current_debt else 0,
        }
        
        # Calculate additional financial metrics
        monthly_savings_capacity = profile_summary['monthly_income'] - profile_summary['monthly_expenses']
        debt_to_income_ratio = 0
        if profile_summary['monthly_income'] > 0:
            debt_to_income_ratio = (profile_summary['current_debt'] / 12) / profile_summary['monthly_income'] * 100
            
        profile_summary['monthly_savings_capacity'] = monthly_savings_capacity
        profile_summary['debt_to_income_ratio'] = debt_to_income_ratio
        
        # Find the specific recommendation
        recommendations_data = recommendation.recommendations
        target_recommendation = None
        
        if rec_type == 'STOCKS':
            # For stocks, find by symbol
            if isinstance(recommendations_data, list):
                for stock in recommendations_data:
                    if stock.get('symbol') == symbol:
                        target_recommendation = stock
                        break
            else:
                # If it's not a list, log the issue for debugging
                logger.error(f"Unexpected format for stock recommendations: {type(recommendations_data)}")
                logger.error(f"Recommendations data: {recommendations_data}")
                return Response(
                    {'error': f'Stock recommendations data is in unexpected format'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        elif rec_type == 'MUTUAL_FUNDS':
            # For mutual funds, match by name or code
            if isinstance(recommendations_data, list):
                for fund in recommendations_data:
                    if fund.get('code') == symbol or fund.get('name') == symbol or fund.get('scheme_name') == symbol or fund.get('fund_name') == symbol:
                        target_recommendation = fund
                        break
            else:
                logger.error(f"Unexpected format for mutual fund recommendations: {type(recommendations_data)}")
                return Response(
                    {'error': f'Mutual fund recommendations data is in unexpected format'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        elif rec_type == 'SIP':
            # For SIP recommendations, search in plans list for matching fund name
            if isinstance(recommendations_data, dict):
                plans = recommendations_data.get('plans', [])
                for plan in plans:
                    if plan.get('fund_name') == symbol:
                        target_recommendation = plan
                        break
            else:
                logger.error(f"Unexpected format for SIP recommendations: {type(recommendations_data)}")
                return Response(
                    {'error': f'SIP recommendations data is in unexpected format'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        elif rec_type == 'FIXED_INCOME':
            # For fixed income options
            if isinstance(recommendations_data, list):
                for option in recommendations_data:
                    # Match by name or any other unique identifier
                    if option.get('name') == symbol or option.get('instrument_name') == symbol:
                        target_recommendation = option
                        break
            else:
                logger.error(f"Unexpected format for fixed income recommendations: {type(recommendations_data)}")
                return Response(
                    {'error': f'Fixed income recommendations data is in unexpected format'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        if not target_recommendation:
            return Response(
                {'error': f'{symbol} not found in your {rec_type.lower()} recommendations'},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Fetch additional data for the recommendation if needed
        if rec_type == 'STOCKS':
            # Get detailed stock analysis
            try:
                from .research import get_stock_price_data, get_fundamental_data, analyze_stock_health
                
                price_data = get_stock_price_data(symbol)
                fundamentals, info = get_fundamental_data(symbol)
                
                if price_data is not None and not price_data.empty:
                    detailed_analysis = analyze_stock_health(price_data, fundamentals, info)
                    
                    # Merge the detailed analysis with the recommendation
                    target_recommendation.update({
                        'detailed_analysis': detailed_analysis
                    })
            except Exception as e:
                logger.error(f"Error fetching detailed stock analysis: {e}")
                # Continue even if detailed analysis fails
        
        # Generate detailed explanation based on recommendation type and user's profile
        detailed_explanation = {
            'profile_match': {
                'risk_tolerance': profile_summary['risk_tolerance'],
                'investment_horizon': profile_summary['investment_time_horizon'],
                'savings_capacity': monthly_savings_capacity,
                'debt_situation': 'High' if debt_to_income_ratio > 35 else 'Moderate' if debt_to_income_ratio > 20 else 'Low'
            },
            'recommendation_factors': [],
            'technical_factors': [],
            'fundamental_factors': [],
            'risk_assessment': [],
            'profile_compatibility': []
        }
        
        # Add explanations based on recommendation type
        if rec_type == 'STOCKS':
            # Extract reasons from the recommendation
            if 'reasons' in target_recommendation:
                detailed_explanation['recommendation_factors'] = target_recommendation['reasons']
            else:
                # Generate default reasons based on risk profile and sector
                sector = target_recommendation.get('sector', 'Unknown')
                risk_level = target_recommendation.get('risk_level', 'Moderate')
                detailed_explanation['recommendation_factors'] = [
                    f"This {sector} stock aligns with your {profile_summary['risk_tolerance']} risk profile",
                    f"The stock has a {risk_level} risk level suitable for your investment strategy"
                ]
                
            # Add technical factors
            tech_indicators = target_recommendation.get('technical_indicators', {})
            if tech_indicators:
                for indicator, value in tech_indicators.items():
                    if isinstance(value, (int, float)):
                        explanation = generate_technical_indicator_explanation(indicator, value)
                        if explanation:
                            detailed_explanation['technical_factors'].append(explanation)
            else:
                # Add default technical analysis if missing
                detailed_explanation['technical_factors'].append(
                    "Technical analysis data is currently being updated. Check back later for detailed insights."
                )
                        
            # Add fundamental factors
            fund_data = target_recommendation.get('fundamental_data', {})
            if fund_data:
                for metric, value in fund_data.items():
                    if isinstance(value, (int, float)) and metric in ['PE Ratio', 'Dividend Yield', 'ROE', 'Debt to Equity', 'Profit Margin']:
                        explanation = generate_fundamental_metric_explanation(metric, value, profile_summary['risk_tolerance'])
                        if explanation:
                            detailed_explanation['fundamental_factors'].append(explanation)
            else:
                # Add default fundamental analysis if missing
                score = target_recommendation.get('score', 50)
                if score > 70:
                    detailed_explanation['fundamental_factors'].append(
                        "The company shows strong fundamental metrics that indicate solid financial health."
                    )
                elif score > 50:
                    detailed_explanation['fundamental_factors'].append(
                        "The company has decent fundamental metrics that align with your investment goals."
                    )
                else:
                    detailed_explanation['fundamental_factors'].append(
                        "The stock is selected primarily for its sector allocation in your portfolio."
                    )
                        
            # Add risk assessment based on risk level
            risk_level = target_recommendation.get('risk_level', 'Moderate')
            detailed_explanation['risk_assessment'] = generate_risk_assessment(risk_level, profile_summary['risk_tolerance'])
            
            # Add compatibility with user profile
            detailed_explanation['profile_compatibility'] = generate_profile_compatibility(
                target_recommendation, 
                profile_summary['risk_tolerance'],
                profile_summary['investment_time_horizon'],
                debt_to_income_ratio
            )
                
        # Combine all data for the response
        response_data = {
            'symbol': symbol,
            'recommendation_type': rec_type,
            'recommendation_data': target_recommendation,
            'profile_summary': profile_summary,
            'detailed_explanation': detailed_explanation
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error generating detailed recommendation explanation: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_technical_indicator_explanation(indicator, value):
    """Generate explanation for technical indicators"""
    if indicator == 'RSI':
        if value < 30:
            return f"RSI of {value:.1f} indicates the stock may be oversold, presenting a potential buying opportunity"
        elif value > 70:
            return f"RSI of {value:.1f} indicates the stock may be overbought, suggesting caution"
        else:
            return f"RSI of {value:.1f} indicates neutral momentum"
    elif indicator == 'MACD':
        if value > 0:
            return f"MACD of {value:.2f} shows positive momentum"
        else:
            return f"MACD of {value:.2f} shows negative momentum"
    elif 'SMA' in indicator:
        period = indicator.replace('SMA', '')
        return f"{period}-day Simple Moving Average: {value:.2f}"
    return None

def generate_fundamental_metric_explanation(metric, value, risk_tolerance):
    """Generate explanation for fundamental metrics"""
    if metric == 'PE Ratio':
        if risk_tolerance == 'conservative':
            if value < 15:
                return f"PE Ratio of {value:.1f} is low, indicating good value which aligns with your conservative profile"
            elif value > 25:
                return f"PE Ratio of {value:.1f} is relatively high compared to ideal conservative picks"
            else:
                return f"PE Ratio of {value:.1f} is moderate and suitable for your risk profile"
        elif risk_tolerance == 'moderate':
            if value < 20:
                return f"PE Ratio of {value:.1f} is attractive for value investors"
            elif value > 30:
                return f"PE Ratio of {value:.1f} is on the higher side, suggesting growth expectations"
            else:
                return f"PE Ratio of {value:.1f} is in a balanced range suitable for your moderate risk profile"
        else:  # aggressive
            if value > 35:
                return f"PE Ratio of {value:.1f} indicates high growth expectations, suitable for aggressive investors"
            else:
                return f"PE Ratio of {value:.1f} indicates moderate valuation"
    elif metric == 'Dividend Yield':
        if value > 3:
            return f"High dividend yield of {value:.2f}% provides good income potential"
        elif value > 1:
            return f"Dividend yield of {value:.2f}% provides moderate income"
        else:
            return f"Low dividend yield of {value:.2f}% suggests company focuses on growth over income"
    elif metric == 'ROE':
        if value > 15:
            return f"ROE of {value:.1f}% indicates strong profitability and efficient use of capital"
        elif value > 10:
            return f"ROE of {value:.1f}% shows good profitability"
        else:
            return f"ROE of {value:.1f}% is below ideal levels"
    elif metric == 'Debt to Equity':
        if value < 0.5:
            return f"Low debt-to-equity ratio of {value:.2f} indicates strong financial health"
        elif value < 1.5:
            return f"Moderate debt-to-equity ratio of {value:.2f} indicates acceptable financial risk"
        else:
            return f"High debt-to-equity ratio of {value:.2f} indicates higher financial risk"
    return None

def generate_risk_assessment(risk_level, user_risk_tolerance):
    """Generate risk assessment based on stock risk level and user's risk tolerance"""
    assessments = []
    
    if risk_level == 'Low':
        assessments.append("This investment has relatively low volatility and is suitable for conservative investors")
        if user_risk_tolerance == 'conservative':
            assessments.append("This aligns perfectly with your conservative risk profile")
        elif user_risk_tolerance == 'moderate':
            assessments.append("This provides stability to your portfolio but may offer lower growth potential than you might prefer")
        else:  # aggressive
            assessments.append("This may provide stability to your portfolio but offers lower growth potential than your risk profile suggests")
    elif risk_level == 'Moderate':
        assessments.append("This investment has moderate volatility with balanced growth potential and risk")
        if user_risk_tolerance == 'conservative':
            assessments.append("This carries slightly more risk than your conservative profile suggests, but can add growth potential")
        elif user_risk_tolerance == 'moderate':
            assessments.append("This aligns well with your moderate risk profile")
        else:  # aggressive
            assessments.append("This provides a balanced option in your portfolio but may offer less growth potential than your risk profile seeks")
    else:  # High
        assessments.append("This investment has higher volatility with greater growth potential and risk")
        if user_risk_tolerance == 'conservative':
            assessments.append("This carries significantly more risk than your conservative profile suggests")
        elif user_risk_tolerance == 'moderate':
            assessments.append("This carries more risk than your moderate profile suggests, but can be balanced with safer investments")
        else:  # aggressive
            assessments.append("This aligns well with your aggressive risk profile, seeking higher returns with higher risk")
    
    return assessments

def generate_profile_compatibility(recommendation, risk_tolerance, investment_horizon, debt_to_income_ratio):
    """Generate explanation of how the recommendation fits with user's financial profile"""
    compatibility = []
    
    # Check risk alignment
    stock_risk = recommendation.get('risk_level', 'Moderate')
    risk_aligned = (
        (stock_risk == 'Low' and risk_tolerance == 'conservative') or
        (stock_risk == 'Moderate' and risk_tolerance == 'moderate') or
        (stock_risk == 'High' and risk_tolerance == 'aggressive') or
        (stock_risk == 'Low' and risk_tolerance == 'moderate') or
        (stock_risk == 'Moderate' and risk_tolerance == 'aggressive')
    )
    
    if risk_aligned:
        compatibility.append(f"This {stock_risk.lower()} risk investment aligns with your {risk_tolerance} risk profile")
    else:
        compatibility.append(f"This {stock_risk.lower()} risk investment differs from your {risk_tolerance} risk profile - consider your overall portfolio balance")
    
    # Check debt situation
    if debt_to_income_ratio > 40:
        compatibility.append("Given your high debt-to-income ratio, consider prioritizing debt reduction alongside conservative investments")
    elif debt_to_income_ratio > 30:
        compatibility.append("Your moderate debt-to-income ratio suggests balancing investments with debt repayment")
    else:
        compatibility.append("Your manageable debt situation allows for following your preferred investment strategy")
    
    # Check sector compatibility with risk profile
    sector = recommendation.get('sector', None)
    if sector:
        if risk_tolerance == 'conservative' and sector in ['FMCG', 'Pharma', 'IT', 'Consumer Goods']:
            compatibility.append(f"This {sector} sector stock is typically suitable for your conservative risk profile")
        elif risk_tolerance == 'moderate' and sector in ['Banking', 'Auto', 'Chemicals', 'Engineering']:
            compatibility.append(f"This {sector} sector stock is well-suited for your moderate risk profile")
        elif risk_tolerance == 'aggressive' and sector in ['Realty', 'Power', 'Metals', 'Oil & Gas']:
            compatibility.append(f"This {sector} sector stock aligns with your aggressive risk profile")
    
    # Check time horizon compatibility
    if 'changes' in recommendation:
        changes = recommendation.get('changes', {})
        if investment_horizon == 'short' and (changes.get('daily', 0) > 0 or changes.get('weekly', 0) > 0):
            compatibility.append("Recent positive short-term performance aligns with your short-term investment horizon")
        elif investment_horizon == 'medium' and (changes.get('monthly', 0) > 0 or changes.get('quarterly', 0) > 0):
            compatibility.append("Strong medium-term performance aligns with your medium-term investment horizon")
        elif investment_horizon == 'long' and (changes.get('quarterly', 0) > 0 or changes.get('yearly', 0) > 0):
            compatibility.append("Solid long-term performance trend aligns with your long-term investment strategy")
    else:
        # Add default time horizon explanation if no changes data
        if investment_horizon == 'short':
            compatibility.append("Consider monitoring this investment closely as it aligns with your short-term horizon")
        elif investment_horizon == 'medium':
            compatibility.append("This investment may be suitable for your medium-term horizon of 3-5 years")
        else:
            compatibility.append("This stock can be a part of your long-term investment strategy")
    
    return compatibility

# Community Views
class CommunityGroupViewSet(viewsets.ModelViewSet):
    queryset = CommunityGroup.objects.all()
    serializer_class = CommunityGroupSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        # Filter groups to show only public ones and those the user is a member of
        user = self.request.user
        return CommunityGroup.objects.filter(
            Q(is_public=True) | Q(members=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CommunityGroupDetailSerializer
        return CommunityGroupSerializer

    def perform_create(self, serializer):
        # Make the creator an admin member
        group = serializer.save(created_by=self.request.user)
        GroupMembership.objects.create(
            user=self.request.user,
            group=group,
            is_admin=True
        )

    def perform_destroy(self, instance):
        # Check if the user is an admin of the group
        user = self.request.user
        if user == instance.created_by or GroupMembership.objects.filter(user=user, group=instance, is_admin=True).exists():
            # Delete the group and all related data (messages, memberships)
            instance.delete()
        else:
            raise PermissionDenied("You must be a group admin to delete this group")

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        user = request.user
        
        # Check if user is already a member
        if group.members.filter(id=user.id).exists():
            return Response(
                {'detail': 'You are already a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user as a member
        GroupMembership.objects.create(user=user, group=group)
        
        return Response({'detail': 'Successfully joined the group.'})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        user = request.user
        
        # Check if user is a member
        try:
            membership = GroupMembership.objects.get(user=user, group=group)
            
            # Check if user is the only admin
            if membership.is_admin and GroupMembership.objects.filter(group=group, is_admin=True).count() <= 1:
                return Response(
                    {'detail': 'You cannot leave the group as you are the only admin.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            membership.delete()
            return Response({'detail': 'Successfully left the group.'})
        
        except GroupMembership.DoesNotExist:
            return Response(
                {'detail': 'You are not a member of this group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user = request.user
        
        # Check if the current user is an admin of the group
        try:
            membership = GroupMembership.objects.get(user=user, group=group)
            if not membership.is_admin:
                return Response(
                    {'detail': 'You must be an admin to remove members.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except GroupMembership.DoesNotExist:
            return Response(
                {'detail': 'You are not a member of this group.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the user to remove
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'detail': 'User ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_remove = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the user to remove is a member
        try:
            membership_to_remove = GroupMembership.objects.get(user=user_to_remove, group=group)
            
            # Cannot remove an admin if you're not the creator of the group
            if membership_to_remove.is_admin and group.created_by != user:
                return Response(
                    {'detail': 'Only the group creator can remove admins.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            membership_to_remove.delete()
            return Response({'detail': 'Member removed successfully.'})
        
        except GroupMembership.DoesNotExist:
            return Response(
                {'detail': 'This user is not a member of the group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def invite(self, request, pk=None):
        group = self.get_object()
        user = request.user
        
        # Check if the current user is an admin of the group
        try:
            membership = GroupMembership.objects.get(user=user, group=group)
            if not membership.is_admin:
                return Response(
                    {'detail': 'You must be an admin to invite members.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except GroupMembership.DoesNotExist:
            return Response(
                {'detail': 'You are not a member of this group.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the username to invite
        username = request.data.get('username')
        if not username:
            return Response(
                {'detail': 'Username is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_invite = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if the user is already a member
        if group.members.filter(id=user_to_invite.id).exists():
            return Response(
                {'detail': 'This user is already a member of the group.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the user to the group
        GroupMembership.objects.create(user=user_to_invite, group=group)
        
        return Response({'detail': 'User has been added to the group.'})


class GroupMessageViewSet(viewsets.ModelViewSet):
    serializer_class = GroupMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return GroupMessage.objects.filter(
            group__members=self.request.user
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        group_id = self.request.data.get('group')
        
        # Check if the user is a member of the group
        try:
            group = CommunityGroup.objects.get(id=group_id)
            if not group.members.filter(id=self.request.user.id).exists():
                raise ValidationError('You are not a member of this group.')
            
            serializer.save(sender=self.request.user)
        except CommunityGroup.DoesNotExist:
            raise ValidationError('Group not found.')
    
    def perform_destroy(self, instance):
        # Check if the user is the sender or an admin of the group
        if instance.sender == self.request.user or GroupMembership.objects.filter(
            user=self.request.user, group=instance.group, is_admin=True
        ).exists():
            # Delete the message
            instance.delete()
        else:
            raise PermissionDenied("You don't have permission to delete this message.")
    
    @action(detail=False, methods=['get'])
    def group_messages(self, request):
        group_id = request.query_params.get('group_id')
        if not group_id:
            return Response(
                {'detail': 'Group ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            group = CommunityGroup.objects.get(id=group_id)
            if not group.members.filter(id=request.user.id).exists():
                return Response(
                    {'detail': 'You are not a member of this group.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all messages for the group, ordered by creation time
            messages = GroupMessage.objects.filter(group=group).order_by('created_at')
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
        except CommunityGroup.DoesNotExist:
            return Response(
                {'detail': 'Group not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['content', 'author__username']
    ordering_fields = ['created_at', 'like_count', 'comment_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Post.objects.all().select_related('author')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer
    
    def perform_create(self, serializer):
        post = serializer.save(author=self.request.user)
        
        # Process hashtags (this is now handled in the Post.save() method)
        # but we'll keep it here as a fallback
        content = post.content
        if content:
            hashtag_names = Hashtag.update_hashtags(content)
            # Add hashtags to the post
            for tag_name in hashtag_names:
                if len(tag_name) < 2:
                    continue
                tag, _ = Hashtag.objects.get_or_create(name=tag_name)
                post.hashtags.add(tag)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        
        # Check if the user already liked the post
        if post.likes.filter(id=request.user.id).exists():
            # Unlike the post
            post.likes.remove(request.user)
            post.like_count = F('like_count') - 1
            post.save()
            return Response({'detail': 'Post unliked.'}, status=status.HTTP_200_OK)
        else:
            # Like the post
            post.likes.add(request.user)
            post.like_count = F('like_count') + 1
            post.save()
            return Response({'detail': 'Post liked.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def save_post(self, request, pk=None):
        post = self.get_object()
        
        # Check if the user already saved the post
        if post.saved_by.filter(id=request.user.id).exists():
            # Unsave the post
            post.saved_by.remove(request.user)
            return Response({'detail': 'Post unsaved.'}, status=status.HTTP_200_OK)
        else:
            # Save the post
            post.saved_by.add(request.user)
            return Response({'detail': 'Post saved.'}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def saved(self, request):
        saved_posts = Post.objects.filter(saved_by=request.user).order_by('-created_at')
        page = self.paginate_queryset(saved_posts)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(saved_posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_posts(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            # Get current user's posts
            posts = Post.objects.filter(author=request.user).order_by('-created_at')
        else:
            # Get specified user's posts
            try:
                user = CustomUser.objects.get(id=user_id)
                posts = Post.objects.filter(author=user).order_by('-created_at')
            except CustomUser.DoesNotExist:
                return Response(
                    {'detail': 'User not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        page = self.paginate_queryset(posts)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Comment.objects.all().select_related('author', 'post')
    
    def perform_create(self, serializer):
        post_id = self.request.data.get('post')
        parent_id = self.request.data.get('parent')
        
        try:
            post = Post.objects.get(id=post_id)
            
            # If it's a reply, check that parent comment exists and belongs to the same post
            if parent_id:
                parent = Comment.objects.get(id=parent_id)
                if parent.post.id != post.id:
                    raise ValidationError('Parent comment does not belong to the specified post.')
            
            # Increment comment count on the post
            post.comment_count = F('comment_count') + 1
            post.save()
            
            serializer.save(author=self.request.user)
        except Post.DoesNotExist:
            raise ValidationError('Post not found.')
        except Comment.DoesNotExist:
            raise ValidationError('Parent comment not found.')
    
    def perform_destroy(self, instance):
        # Decrement comment count on the post
        post = instance.post
        post.comment_count = F('comment_count') - 1
        post.save()
        
        # Delete the comment
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def post_comments(self, request):
        post_id = request.query_params.get('post_id')
        if not post_id:
            return Response(
                {'detail': 'Post ID is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            post = Post.objects.get(id=post_id)
            comments = Comment.objects.filter(post=post, parent=None).order_by('created_at')
            serializer = CommentWithRepliesSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        except Post.DoesNotExist:
            return Response(
                {'detail': 'Post not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['date', 'created_at', 'attendees']
    pagination_class = None  # Disable pagination for now
    
    def list(self, request, *args, **kwargs):
        # Handle empty querysets more gracefully
        queryset = self.filter_queryset(self.get_queryset())
        if not queryset.exists():
            # Return empty list instead of 404
            return Response([])
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        # Add default attendees if not provided
        instance = serializer.save(attendees=serializer.validated_data.get('attendees', 0))
        return instance

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trending_hashtags(request):
    """Get trending hashtags from the last 2 days"""
    days = request.query_params.get('days', 2)
    limit = request.query_params.get('limit', 10)
    
    try:
        days = int(days)
        limit = int(limit)
    except ValueError:
        days = 2
        limit = 10
    
    trending = Hashtag.get_trending(days=days, limit=limit)
    
    hashtags = [
        {
            'name': tag.name,
            'count': tag.count,
            'last_used': tag.last_used
        }
        for tag in trending
    ]
    
    return Response(hashtags, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fix_media_structure(request):
    """
    Fix media directory structure by moving files from wrong locations to correct ones
    """
    try:
        # Paths
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        old_group_pics_dir = os.path.join(base_dir, 'group_pics')
        media_dir = os.path.join(base_dir, 'media')
        new_group_pics_dir = os.path.join(media_dir, 'group_pics')
        
        # Create media directory if it doesn't exist
        if not os.path.exists(media_dir):
            os.makedirs(media_dir)
            
        # Create subdirectories if they don't exist
        for subdir in ['group_pics', 'group_messages', 'group_videos', 'post_images', 'post_videos', 'profile_pics']:
            subdir_path = os.path.join(media_dir, subdir)
            if not os.path.exists(subdir_path):
                os.makedirs(subdir_path)
        
        # Move files from old to new location if old location exists
        files_moved = []
        if os.path.exists(old_group_pics_dir):
            for filename in os.listdir(old_group_pics_dir):
                old_file_path = os.path.join(old_group_pics_dir, filename)
                new_file_path = os.path.join(new_group_pics_dir, filename)
                
                if os.path.isfile(old_file_path):
                    # Copy file to new location
                    shutil.copy2(old_file_path, new_file_path)
                    files_moved.append(filename)
        
        # Update database entries that might have broken paths
        updated_groups = []
        for group in CommunityGroup.objects.filter(profile_picture__isnull=False):
            old_path = group.profile_picture.name
            if 'group_pics' in old_path and not old_path.startswith('group_pics/'):
                # Fix the path to use the correct format
                new_path = f'group_pics/{os.path.basename(old_path)}'
                group.profile_picture = new_path
                group.save()
                updated_groups.append(group.id)
        
        return Response({
            'status': 'success',
            'message': 'Media directory structure fixed',
            'files_moved': files_moved,
            'groups_updated': updated_groups
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    """Follow a user"""
    if int(user_id) == request.user.id:
        return Response({"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        to_follow = CustomUser.objects.get(id=user_id)
        
        # Check if already following
        if request.user.following.filter(id=to_follow.id).exists():
            return Response({"detail": "You are already following this user."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create follow relationship
        follow = UserFollow.objects.create(follower=request.user, following=to_follow)
        
        serializer = UserFollowSerializer(follow, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):
    """Unfollow a user"""
    try:
        to_unfollow = CustomUser.objects.get(id=user_id)
        
        # Check if following
        try:
            follow = UserFollow.objects.get(follower=request.user, following=to_unfollow)
            follow.delete()
            return Response({"detail": "Successfully unfollowed."}, status=status.HTTP_200_OK)
        except UserFollow.DoesNotExist:
            return Response({"detail": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST)
            
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_users(request):
    """Get active users based on post activity"""
    # Get users with at least one post, ordered by post count
    # Exclude the current user from results
    try:
        # Annotate all users with post count
        active_users = CustomUser.objects.exclude(id=request.user.id) \
            .annotate(posts_count=Count('posts')) \
            .filter(posts_count__gt=0) \
            .order_by('-posts_count')[:10]
        
        # Check if we found any active users
        if not active_users.exists():
            # Fall back to returning some users even when there are no posts
            active_users = CustomUser.objects.exclude(id=request.user.id) \
                .order_by('-date_joined')[:5]
        
        serializer = UserBriefSerializer(active_users, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        # Log the error
        logger.error(f"Error in get_active_users: {str(e)}")
        
        # Return empty list rather than 500 error
        return Response([], status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_followers(request, user_id=None):
    """Get a user's followers"""
    try:
        target_user = request.user if user_id is None else CustomUser.objects.get(id=user_id)
        followers = target_user.followers.all()
        serializer = UserBriefSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_following(request, user_id=None):
    """Get users that a user is following"""
    try:
        target_user = request.user if user_id is None else CustomUser.objects.get(id=user_id)
        following = target_user.following.all()
        serializer = UserBriefSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)
    except CustomUser.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class CourseListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        courses = Course.objects.all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)

class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, course_id):
        try:
            course = Course.objects.get(course_id=course_id)
            serializer = CourseDetailSerializer(course)
            
            # Check if user is already enrolled
            try:
                enrollment = Enrollment.objects.get(user=request.user, course=course)
                user_progress = UserProgress.objects.get(enrollment=enrollment)
                
                # Include user's progress in the response
                response_data = serializer.data
                response_data['user_progress'] = {
                    'current_section': user_progress.current_section,
                    'completed_sections': user_progress.completed_sections,
                    'quiz_scores': user_progress.quiz_scores,
                    'overall_progress': user_progress.overall_progress
                }
                return Response(response_data)
            except (Enrollment.DoesNotExist, UserProgress.DoesNotExist):
                # User is not enrolled, return course details only
                return Response(serializer.data)
                
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

class CourseEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, course_id):
        try:
            course = Course.objects.get(course_id=course_id)
            
            # Check if already enrolled
            enrollment, created = Enrollment.objects.get_or_create(
                user=request.user,
                course=course
            )
            
            # If new enrollment, create progress record
            if created:
                UserProgress.objects.create(
                    enrollment=enrollment,
                    current_section=1,
                    completed_sections=[],
                    quiz_scores={},
                    overall_progress=0
                )
                return Response({'message': 'Successfully enrolled in the course'}, status=201)
            else:
                return Response({'message': 'Already enrolled in this course'}, status=200)
                
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)

class UserEnrollmentsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        enrollments = Enrollment.objects.filter(user=request.user)
        
        # Get progress for each enrollment
        enrollments_data = []
        for enrollment in enrollments:
            enrollment_data = {
                'id': enrollment.id,
                'course': {
                    'id': enrollment.course.id,
                    'course_id': enrollment.course.course_id,
                    'title': enrollment.course.title,
                    'description': enrollment.course.description,
                    'total_sections': enrollment.course.total_sections,
                    'estimated_duration': enrollment.course.estimated_duration,
                },
                'enrollment_date': enrollment.enrollment_date,
                'last_accessed': enrollment.last_accessed,
                'is_completed': enrollment.is_completed
            }
            
            try:
                progress = UserProgress.objects.get(enrollment=enrollment)
                enrollment_data['progress'] = {
                    'current_section': progress.current_section,
                    'completed_sections': progress.completed_sections,
                    'overall_progress': progress.overall_progress
                }
            except UserProgress.DoesNotExist:
                enrollment_data['progress'] = {
                    'current_section': 1,
                    'completed_sections': [],
                    'overall_progress': 0
                }
                
            enrollments_data.append(enrollment_data)
            
        return Response(enrollments_data)

class QuizSubmissionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, course_id):
        try:
            # Get necessary data from request
            section_id = request.data.get('section_id')
            answers = request.data.get('answers')
            
            if not section_id or not answers:
                return Response({'error': 'Missing required fields'}, status=400)
            
            # Get course and enrollment
            course = Course.objects.get(course_id=course_id)
            enrollment = Enrollment.objects.get(user=request.user, course=course)
            progress = UserProgress.objects.get(enrollment=enrollment)
            
            # Get course content to check answers
            course_content = course.get_content()
            
            # Find the quiz for the specified section
            quiz_data = None
            
            # Handle different JSON structures
            if 'sections' in course_content:
                # For basicofstockmarket.json structure
                for section in course_content['sections']:
                    if section['sectionId'] == int(section_id) or section['id'] == section_id:
                        if 'quiz' in section:
                            quiz_data = section['quiz']
                        break
            elif 'course' in course_content and 'sections' in course_content['course']:
                # For baicofriskmanagement.json structure
                for section in course_content['course']['sections']:
                    if section['id'] == section_id:
                        if 'quiz' in section:
                            quiz_data = section['quiz']
                        break
            # For basicofinvestment.json structure
            elif 'sections' in course_content and all(isinstance(s, dict) and 'sectionId' in s for s in course_content['sections']):
                for section in course_content['sections']:
                    if section['sectionId'] == int(section_id):
                        if 'quiz' in section:
                            quiz_data = section['quiz']
                        break
            
            if not quiz_data:
                return Response({'error': 'Quiz not found for this section'}, status=404)
            
            # Calculate score
            correct_answers = 0
            total_questions = len(quiz_data['questions'])
            
            for question in quiz_data['questions']:
                question_id = question.get('questionId') or question.get('id')
                if question_id in answers:
                    user_answer = answers[question_id]
                    correct_answer = None
                    
                    # Handle different correct answer formats
                    if 'correctAnswer' in question and isinstance(question['correctAnswer'], str):
                        # Format where correctAnswer is the actual answer text
                        correct_answer = question['correctAnswer']
                        if user_answer == correct_answer:
                            correct_answers += 1
                    elif 'correctAnswer' in question and isinstance(question['correctAnswer'], int):
                        # Format where correctAnswer is the index
                        correct_answer = question['options'][question['correctAnswer']]
                        if user_answer == correct_answer:
                            correct_answers += 1
            
            # Calculate percentage score
            score_percentage = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
            
            # Check if user passed the quiz
            passing_score = quiz_data.get('passingScore', 4)  # Default to 4 if not specified
            passed = correct_answers >= passing_score
            
            # Update progress if passed
            if passed:
                progress.complete_section(int(section_id), score_percentage)
                
                # Check if this was the last section and update course completion
                if int(section_id) == course.total_sections:
                    enrollment.is_completed = True
                    enrollment.save()
            
            return Response({
                'score': score_percentage,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'passed': passed,
                'current_section': progress.current_section,
                'overall_progress': progress.overall_progress
            })
            
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=404)
        except Enrollment.DoesNotExist:
            return Response({'error': 'Not enrolled in this course'}, status=403)
        except UserProgress.DoesNotExist:
            return Response({'error': 'Progress record not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_user_recommendations(request):
    """
    Test endpoint specifically for generating recommendations based on a user's actual FinancialProfile
    """
    try:
        # First check if user has a financial profile
        try:
            financial_profile = FinancialProfile.objects.get(user=request.user)
        except FinancialProfile.DoesNotExist:
            return Response(
                {'error': 'Financial profile not found. Please complete your profile first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate debt-to-income ratio
        monthly_income = float(financial_profile.monthly_income)
        current_debt = float(financial_profile.current_debt) if financial_profile.current_debt else 0
        debt_to_income = current_debt / (monthly_income * 12) if monthly_income > 0 else float('inf')
        
        # Get risk tolerance
        risk_tolerance = financial_profile.risk_tolerance.lower()
        
        # Log the risk tolerance and debt-to-income ratio
        logger.info(f"User risk tolerance: {risk_tolerance}, Debt-to-income ratio: {debt_to_income:.2f}")
        
        # Use the management command to refresh all recommendations
        from django.core.management import call_command
        import io
        from contextlib import redirect_stdout
        
        # Capture the output of the command
        output = io.StringIO()
        with redirect_stdout(output):
            call_command('refresh_recommendations', user_id=request.user.id, all=True)
        
        command_output = output.getvalue()
        logger.info(f"Command output: {command_output}")
        
        # Fetch all recommendation types for this user
        recommendations = UserRecommendation.objects.filter(user=request.user)
        
        # Format the response data
        response_data = {}
        for rec in recommendations:
            rec_type = rec.recommendation_type.lower()
            response_data[rec_type] = {
                'data': rec.recommendations,
                'last_updated': rec.updated_at
            }
        
        return Response({
            'profile_summary': {
                'risk_tolerance': risk_tolerance,
                'investment_time_horizon': financial_profile.investment_time_horizon.lower(),
                'monthly_savings_capacity': monthly_income - float(financial_profile.monthly_expenses),
                'debt_to_income_ratio': debt_to_income,
            },
            'recommendations': response_data
        })
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
