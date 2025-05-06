from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
import json
import re
from django.conf import settings

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True)
    is_verified = models.BooleanField(default=False)  # To mark account as verified
    has_completed_financial_info = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True, max_length=500)
    following = models.ManyToManyField('self', through='UserFollow', symmetrical=False, related_name='followers')

    def __str__(self):
        return self.email
        
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
        
    @property
    def followers_count(self):
        return self.followers.count()
        
    @property
    def following_count(self):
        return self.following.count()
        
    @property
    def posts_count(self):
        return self.posts.count()

class UserFollow(models.Model):
    follower = models.ForeignKey(CustomUser, related_name='user_follows', on_delete=models.CASCADE)
    following = models.ForeignKey(CustomUser, related_name='user_followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('follower', 'following')
        
    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

class OTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6, blank=True, null=True)
    datetime = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.otp}"

class FinancialProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    monthly_expenses = models.DecimalField(max_digits=12, decimal_places=2)
    current_savings = models.DecimalField(max_digits=12, decimal_places=2)
    existing_investments = models.DecimalField(max_digits=12, decimal_places=2)
    current_debt = models.DecimalField(max_digits=12, decimal_places=2)
    financial_goals = models.TextField()
    risk_tolerance = models.CharField(max_length=20)
    investment_time_horizon = models.CharField(max_length=20)
    investment_preferences = models.JSONField(default=list)

    def __str__(self):
        return f"{self.user.email}'s Financial Profile"

class UserRecommendation(models.Model):
    """
    Model for storing financial recommendations for each user
    """
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, related_name='recommendations')
    recommendation_type = models.CharField(max_length=50, choices=[
        ('STOCKS', 'Stocks'),
        ('MUTUAL_FUNDS', 'Mutual Funds'),
        ('SIP', 'SIP'),
        ('FIXED_INCOME', 'Fixed Income')
    ], default='STOCKS')
    recommendations = models.JSONField(default=dict)
    status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ])
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_updated = models.DateTimeField(auto_now=True) 
    
    class Meta:
        unique_together = ('user', 'recommendation_type')
        
    def get_recommendations(self):
        """Return the recommendations as a Python object"""
        return self.recommendations
    
    def set_recommendations(self, recommendations):
        """Set the recommendations"""
        self.recommendations = recommendations
        self.save()
    
    @classmethod
    def get_for_user(cls, user, recommendation_type):
        """Get recommendations for a specific user and type"""
        try:
            return cls.objects.get(user=user, recommendation_type=recommendation_type)
        except cls.DoesNotExist:
            return None
    
    def __str__(self):
        return f"{self.recommendation_type} recommendations for {self.user.username}"

class MarketData(models.Model):
    """
    Model for storing market data like indices, top gainers/losers, etc.
    """
    data_type = models.CharField(max_length=50)  # e.g., 'nifty', 'sensex', 'top_gainers', 'top_losers'
    data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('data_type',)
        
    @classmethod
    def get_data(cls, data_type):
        """Get market data by type"""
        try:
            return cls.objects.get(data_type=data_type).data
        except cls.DoesNotExist:
            return None
            
    @classmethod
    def update_data(cls, data_type, data):
        """Update or create market data"""
        obj, created = cls.objects.update_or_create(
            data_type=data_type,
            defaults={'data': data}
        )
        return obj
    
    def __str__(self):
        return f"{self.data_type} market data (updated: {self.last_updated.strftime('%Y-%m-%d %H:%M')})"

class StockData(models.Model):
    """Model to store stock data fetched from external sources"""
    symbol = models.CharField(max_length=30, primary_key=True)
    name = models.CharField(max_length=255)
    data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} - {self.name}"

class MutualFundData(models.Model):
    """Model to store mutual fund data fetched from external sources"""
    scheme_code = models.CharField(max_length=50, primary_key=True)
    scheme_name = models.CharField(max_length=255)
    data = models.JSONField()
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.scheme_code} - {self.scheme_name}"

class CommunityGroup(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='GroupMembership', related_name='joined_groups')
    is_public = models.BooleanField(default=True)
    profile_picture = models.ImageField(upload_to='group_pics/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']

class GroupMembership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE)
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'group')

class GroupMessage(models.Model):
    group = models.ForeignKey(CommunityGroup, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='group_messages/', blank=True, null=True)
    video = models.FileField(upload_to='group_videos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

class Hashtag(models.Model):
    """Model to track hashtags used in posts"""
    name = models.CharField(max_length=100, unique=True)
    count = models.IntegerField(default=1)
    last_used = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-count', '-last_used']
    
    def __str__(self):
        return f"#{self.name} (used {self.count} times)"
    
    @classmethod
    def extract_from_text(cls, text):
        """Extract hashtags from text content"""
        if not text:
            return []
        
        # Find all hashtags using regex
        hashtags = re.findall(r'#(\w+)', text)
        return [tag.lower() for tag in hashtags]
    
    @classmethod
    def update_hashtags(cls, text):
        """Update hashtag counts from text content"""
        hashtags = cls.extract_from_text(text)
        for tag_name in hashtags:
            # Skip very short hashtags
            if len(tag_name) < 2:
                continue
                
            tag, created = cls.objects.get_or_create(name=tag_name)
            if not created:
                tag.count += 1
                tag.save()
        return hashtags
    
    @classmethod
    def get_trending(cls, days=2, limit=5):
        """Get trending hashtags in the last X days"""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        return cls.objects.filter(last_used__gte=cutoff_date).order_by('-count', '-last_used')[:limit]

class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    video = models.FileField(upload_to='post_videos/', blank=True, null=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)
    like_count = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    saved_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='saved_posts', blank=True)
    hashtags = models.ManyToManyField(Hashtag, related_name='posts', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Save the post first
        super().save(*args, **kwargs)
        
        # Process hashtags
        hashtag_names = Hashtag.update_hashtags(self.content)
        
        # Clear existing hashtags and add the new ones
        self.hashtags.clear()
        for tag_name in hashtag_names:
            if len(tag_name) < 2:
                continue
            tag, _ = Hashtag.objects.get_or_create(name=tag_name)
            self.hashtags.add(tag)

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.id}"

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date = models.DateTimeField()
    attendees = models.IntegerField(default=0)
    image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class Course(models.Model):
    """Model to store information about courses or learning modules"""
    course_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    total_sections = models.IntegerField()
    estimated_duration = models.CharField(max_length=50)
    author = models.CharField(max_length=255)
    last_updated = models.DateField()
    content_file = models.CharField(max_length=255)  # Path to the JSON file with course content
    
    def __str__(self):
        return self.title
    
    def get_content(self):
        """Load course content from JSON file"""
        import json
        import os
        from django.conf import settings
        
        file_path = os.path.join(settings.BASE_DIR, 'app', self.content_file)
        with open(file_path, 'r') as file:
            if self.content_file.endswith('basicofstockmarket.json'):
                return json.load(file)
            elif self.content_file.endswith('baicofriskmanagement.json'):
                data = json.load(file)
                return data['course'] if 'course' in data else data
            elif self.content_file.endswith('basicofinvestment.json'):
                return json.load(file)
            else:
                return json.load(file)

class Enrollment(models.Model):
    """Model to track user enrollment in courses"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrollment_date = models.DateTimeField(auto_now_add=True)
    last_accessed = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'course')
    
    def __str__(self):
        return f"{self.user.username} - {self.course.title}"

class UserProgress(models.Model):
    """Model to track user progress in a course"""
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='progress')
    current_section = models.IntegerField(default=1)
    completed_sections = models.JSONField(default=list)
    quiz_scores = models.JSONField(default=dict)
    overall_progress = models.IntegerField(default=0)  # Percentage of course completed
    
    def __str__(self):
        return f"Progress for {self.enrollment}"
    
    def update_progress(self):
        """Update overall progress based on completed sections"""
        total_sections = self.enrollment.course.total_sections
        if total_sections > 0:
            self.overall_progress = (len(self.completed_sections) * 100) // total_sections
        self.save()
    
    def complete_section(self, section_id, quiz_score=None):
        """Mark a section as completed and update quiz score"""
        if section_id not in self.completed_sections:
            self.completed_sections.append(section_id)
        
        if quiz_score is not None:
            self.quiz_scores[str(section_id)] = quiz_score
        
        # Move to next section if available
        if self.current_section == section_id and section_id < self.enrollment.course.total_sections:
            self.current_section = section_id + 1
        
        self.update_progress()
        return self.current_section
