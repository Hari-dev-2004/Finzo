from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from .models import (CustomUser, UserRecommendation, FinancialProfile, 
                    MarketData, StockData, MutualFundData, 
                    CommunityGroup, GroupMembership, GroupMessage, Post, Comment, Event, UserFollow, Course, Enrollment, UserProgress)
import logging

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This email already exists.")]
    )
    phone_number = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="This phone number already exists.")]
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'email', 'password']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def create(self, validated_data):
        """
        Additional check for duplicate phone_number and email before creating a user.
        This ensures database-level validation and proper error handling.
        """
        if User.objects.filter(phone_number=validated_data['phone_number']).exists():
            raise serializers.ValidationError({"phone_number": ["This phone number already exists."]})
        if User.objects.filter(email=validated_data['email']).exists():
            raise serializers.ValidationError({"email": ["This email already exists."]})
        user = User.objects.create_user(
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data['phone_number'],
            email=validated_data['email'],
            username=validated_data['email'],  # Using email as username
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        logger = logging.getLogger(__name__)
        
        phone_number = data.get("phone_number")
        password = data.get("password")
        
        logger.info(f"Validating login for phone: {phone_number}")

        try:
            # Try to get the user by phone number
            user = User.objects.get(phone_number=phone_number)
            logger.info(f"User found: {user.email}")

            # Check the password
            if not user.check_password(password):
                logger.warning(f"Incorrect password for user: {user.email}")
                raise serializers.ValidationError({"password": ["Incorrect password."]})

            # Check if the user is active
            if not user.is_active:
                logger.warning(f"Inactive user attempt to login: {user.email}")
                raise serializers.ValidationError({"non_field_errors": ["This account is inactive."]})
                
            # Add user to validated data
            data['user'] = user
            return data
            
        except User.DoesNotExist:
            logger.warning(f"Login attempt with non-existent phone: {phone_number}")
            raise serializers.ValidationError({"phone_number": ["No account found with this phone number."]})
        except Exception as e:
            logger.error(f"Unexpected error in login validation: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise

# -------------------------
# OTP Section (Email-based via SMTP)
# -------------------------

class OTPSendSerializer(serializers.Serializer):
    # For email OTP verification, we expect the user's email.
    email = serializers.EmailField(required=True)

class OTPVerifySerializer(serializers.Serializer):
    # For verifying the OTP sent via email.
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True)

class FinancialProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialProfile
        fields = '__all__'
        read_only_fields = ('user',)

class UserProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    posts_count = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'display_name', 'first_name', 'last_name', 
            'email', 'phone_number', 'profile_picture', 'bio', 'followers_count', 
            'following_count', 'posts_count', 'is_following'
        ]
        
    def get_display_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username
        
    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user != obj:
            return request.user.following.filter(id=obj.id).exists()
        return False

class FinancialProfileUpdateSerializer(serializers.ModelSerializer):
    existing_investments = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    financial_goals = serializers.CharField(required=False, allow_blank=True)
    investment_preferences = serializers.JSONField(required=False, default=list)
    
    class Meta:
        model = FinancialProfile
        fields = [
            'monthly_income', 'monthly_expenses', 'current_savings',
            'existing_investments', 'current_debt', 'financial_goals', 
            'risk_tolerance', 'investment_time_horizon', 'investment_preferences'
        ]

class UserBriefSerializer(serializers.ModelSerializer):
    """Brief serializer for user information in community features"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'display_name', 'profile_picture', 'phone_number', 'email']
        
    def get_display_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

class CommentSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    reply_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'content', 'parent', 'created_at', 'updated_at', 'reply_count']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_reply_count(self, obj):
        return obj.replies.count()

class CommentWithRepliesSerializer(CommentSerializer):
    replies = serializers.SerializerMethodField()
    
    class Meta(CommentSerializer.Meta):
        fields = CommentSerializer.Meta.fields + ['replies']
    
    def get_replies(self, obj):
        replies = obj.replies.all().order_by('created_at')
        return CommentSerializer(replies, many=True).data

class PostSerializer(serializers.ModelSerializer):
    author = UserBriefSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'content', 'image', 'video', 
                 'like_count', 'comment_count', 'created_at', 'updated_at', 
                 'is_liked', 'is_saved']
        read_only_fields = ['created_at', 'updated_at', 'like_count', 'comment_count']
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by.filter(id=request.user.id).exists()
        return False

class PostDetailSerializer(PostSerializer):
    comments = serializers.SerializerMethodField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']
    
    def get_comments(self, obj):
        # Only get top-level comments (no parent)
        comments = obj.comments.filter(parent=None).order_by('-created_at')
        return CommentWithRepliesSerializer(comments, many=True, context=self.context).data

class GroupMessageSerializer(serializers.ModelSerializer):
    sender = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = GroupMessage
        fields = ['id', 'group', 'sender', 'content', 'image', 'video', 'created_at']
        read_only_fields = ['sender']

class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'group', 'is_admin', 'joined_at']
        read_only_fields = ['joined_at']

class CommunityGroupSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = CommunityGroup
        fields = ['id', 'name', 'description', 'is_public', 'profile_picture', 
                 'created_by', 'member_count', 'created_at', 'updated_at',
                 'is_member', 'is_admin']
        read_only_fields = ['created_at', 'updated_at', 'member_count']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False
    
    def get_is_admin(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                membership = GroupMembership.objects.get(user=request.user, group=obj)
                return membership.is_admin
            except GroupMembership.DoesNotExist:
                return False
        return False

class CommunityGroupDetailSerializer(CommunityGroupSerializer):
    members = serializers.SerializerMethodField()
    recent_messages = serializers.SerializerMethodField()
    
    class Meta(CommunityGroupSerializer.Meta):
        fields = CommunityGroupSerializer.Meta.fields + ['members', 'recent_messages']
    
    def get_members(self, obj):
        memberships = GroupMembership.objects.filter(group=obj).select_related('user')
        return GroupMembershipSerializer(memberships, many=True).data
    
    def get_recent_messages(self, obj):
        messages = obj.messages.order_by('-created_at')[:20]
        return GroupMessageSerializer(messages, many=True).data

# Community Serializers
class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_picture']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'date', 'attendees', 'image', 'created_at']

class UserFollowSerializer(serializers.ModelSerializer):
    follower = UserBriefSerializer(read_only=True)
    following = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = UserFollow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['created_at']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'course_id', 'title', 'description', 'total_sections', 
                 'estimated_duration', 'author', 'last_updated']

class CourseDetailSerializer(serializers.ModelSerializer):
    content = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'course_id', 'title', 'description', 'total_sections', 
                 'estimated_duration', 'author', 'last_updated', 'content']
    
    def get_content(self, obj):
        return obj.get_content()

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'enrollment_date', 'last_accessed', 'is_completed']

class UserProgressSerializer(serializers.ModelSerializer):
    course = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProgress
        fields = ['id', 'course', 'current_section', 'completed_sections', 
                 'quiz_scores', 'overall_progress']
    
    def get_course(self, obj):
        return CourseSerializer(obj.enrollment.course).data

