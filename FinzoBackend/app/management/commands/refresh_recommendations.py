import logging
import time
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db.models import Q
from django.utils import timezone

from app.models import CustomUser, FinancialProfile, UserRecommendation
from app.recommendation_system import (
    generate_stock_recommendations,
    generate_mutual_fund_recommendations,
    generate_portfolio_guidance,
    generate_all_recommendations
)

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Refreshes investment recommendations for users based on risk tolerance and debt-to-income ratio'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Update recommendations for a specific user ID only',
        )
        parser.add_argument(
            '--type',
            type=str,
            help='Recommendation type to refresh (STOCKS, MUTUAL_FUNDS, SIP, FIXED_INCOME)',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Refresh all recommendation types',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        recommendation_type = options.get('type')
        refresh_all = options.get('all')
        
        start_time = time.time()
        
        # Filter users to process
        if user_id:
            users = CustomUser.objects.filter(id=user_id)
            if not users.exists():
                self.stdout.write(self.style.ERROR(f"User with ID {user_id} not found."))
                return
        else:
            # Filter only verified users with financial profiles
            users = CustomUser.objects.filter(is_verified=True, has_completed_financial_info=True)
        
        self.stdout.write(f"Processing recommendations for {users.count()} users...")
        processed_count = 0
        
        for user in users:
            try:
                # Get the user's financial profile
                try:
                    financial_profile = FinancialProfile.objects.get(user=user)
                except FinancialProfile.DoesNotExist:
                    self.stdout.write(f"Skipping user {user.email}: No financial profile found.")
                    continue
                
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
                
                # Process specific recommendation type or all types
                types_to_process = []
                
                if refresh_all:
                    types_to_process = ['STOCKS', 'MUTUAL_FUNDS', 'SIP', 'FIXED_INCOME']
                elif recommendation_type:
                    types_to_process = [recommendation_type]
                else:
                    # Default to all types
                    types_to_process = ['STOCKS', 'MUTUAL_FUNDS', 'SIP', 'FIXED_INCOME']
                
                # Process each recommendation type
                for rec_type in types_to_process:
                    try:
                        self.stdout.write(f"Generating {rec_type} recommendations for {user.email}...")
                        
                        if rec_type == 'STOCKS':
                            # Generate stock recommendations
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
                                self.stdout.write(self.style.SUCCESS(f"  ✓ Stock recommendations updated"))
                            else:
                                error_msg = result.get('message', "No stock recommendations generated")
                                self.stdout.write(self.style.WARNING(f"  ✗ Failed to generate stock recommendations: {error_msg}"))
                                UserRecommendation.objects.update_or_create(
                                    user=user,
                                    recommendation_type='STOCKS',
                                    defaults={
                                        'recommendations': [],
                                        'status': 'failed',
                                        'error_message': error_msg,
                                        'updated_at': timezone.now()
                                    }
                                )
                                
                        elif rec_type == 'MUTUAL_FUNDS':
                            # Generate mutual fund recommendations
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
                                self.stdout.write(self.style.SUCCESS(f"  ✓ Mutual fund recommendations updated"))
                            else:
                                error_msg = result.get('message', "No mutual fund recommendations generated")
                                self.stdout.write(self.style.WARNING(f"  ✗ Failed to generate mutual fund recommendations: {error_msg}"))
                                UserRecommendation.objects.update_or_create(
                                    user=user,
                                    recommendation_type='MUTUAL_FUNDS',
                                    defaults={
                                        'recommendations': [],
                                        'status': 'failed',
                                        'error_message': error_msg,
                                        'updated_at': timezone.now()
                                    }
                                )
                                
                        elif rec_type in ['SIP', 'FIXED_INCOME']:
                            # Generate all recommendations and extract specific types
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
                                    self.stdout.write(self.style.SUCCESS(f"  ✓ SIP recommendations updated"))
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
                                    self.stdout.write(self.style.SUCCESS(f"  ✓ Fixed income recommendations updated"))
                                else:
                                    self.stdout.write(self.style.WARNING(f"  ✗ No {rec_type} recommendations found in results"))
                                    UserRecommendation.objects.update_or_create(
                                        user=user,
                                        recommendation_type=rec_type,
                                        defaults={
                                            'recommendations': [],
                                            'status': 'failed',
                                            'error_message': f"No {rec_type} recommendations found in results",
                                            'updated_at': timezone.now()
                                        }
                                    )
                            else:
                                error_msg = result.get('message', f"No {rec_type} recommendations generated")
                                self.stdout.write(self.style.WARNING(f"  ✗ Failed to generate {rec_type} recommendations: {error_msg}"))
                                UserRecommendation.objects.update_or_create(
                                    user=user,
                                    recommendation_type=rec_type,
                                    defaults={
                                        'recommendations': [],
                                        'status': 'failed',
                                        'error_message': error_msg,
                                        'updated_at': timezone.now()
                                    }
                                )
                                
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"  ✗ Error processing {rec_type} for {user.email}: {str(e)}"))
                        logger.error(f"Error generating {rec_type} recommendations for {user.email}: {e}")
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
                
                processed_count += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error processing user {user.email}: {str(e)}"))
                logger.error(f"Error processing recommendations for {user.email}: {e}")
        
        # Calculate and log execution time
        execution_time = time.time() - start_time
        self.stdout.write(self.style.SUCCESS(f"Recommendations refreshed for {processed_count} users in {execution_time:.2f} seconds.")) 