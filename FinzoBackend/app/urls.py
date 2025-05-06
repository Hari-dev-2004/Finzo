from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ( RegisterView, LoginView, SendEmailOTPView, VerifyEmailOTPView, FinancialProfileView, UserProfileView,
                    get_commodity, 
                    get_mutual_fund, 
                    random_stocks, 
                    gainers_losers, 
                    index_data,
                     search_stocks, analyze_stock,
                     test_recommendations, get_investment_recommendations,
                     get_user_recommendations, refresh_user_recommendation,
                     dashboard, test_user_recommendations,
                     get_recommendation_details,
                     CommunityGroupViewSet, GroupMessageViewSet, PostViewSet, CommentViewSet,
                     EventViewSet, trending_hashtags, fix_media_structure,
                     follow_user, unfollow_user, get_active_users, get_user_followers, get_user_following )

# Setup the router for ViewSets
router = DefaultRouter()
router.register(r'community/groups', CommunityGroupViewSet, basename='communitygroup')
router.register(r'community/messages', GroupMessageViewSet, basename='groupmessage')
router.register(r'community/posts', PostViewSet, basename='post')
router.register(r'community/comments', CommentViewSet, basename='comment')
router.register(r'community/events', EventViewSet, basename='event')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Community endpoints
    path('community/trending-hashtags/', trending_hashtags, name='trending-hashtags'),
    path('community/active-users/', get_active_users, name='active-users'),
    
    # User profile and follow endpoints
    path('users/profile/', UserProfileView.as_view(), name='user-profile'),
    path('users/profile/<str:username>/', UserProfileView.as_view(), name='user-profile-detail'),
    path('users/<int:user_id>/follow/', follow_user, name='follow-user'),
    path('users/<int:user_id>/unfollow/', unfollow_user, name='unfollow-user'),
    path('users/<int:user_id>/followers/', get_user_followers, name='user-followers'),
    path('users/<int:user_id>/following/', get_user_following, name='user-following'),
    path('users/followers/', get_user_followers, name='current-user-followers'),
    path('users/following/', get_user_following, name='current-user-following'),
    
    # Existing URL patterns
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('user-profile/', UserProfileView.as_view(), name='user-profile'),
    path('financial-profile/', FinancialProfileView.as_view(), name='financial-profile'),
    path('send-email-otp/', SendEmailOTPView.as_view(), name='send-email-otp'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify-email-otp'),
    path('dashboard/', dashboard, name='dashboard'),
    path('commodity/', get_commodity, name='commodity-data'),
    path('mutual-fund/', get_mutual_fund, name='mutual-fund-data'),
    path('random-stocks/', random_stocks, name='random-stocks'),
    path('market-movers/', gainers_losers, name='gainers-losers'),
    path('index/', index_data, name='index-data'),
    path('analyze-stock/', analyze_stock, name='analyze-stock'),
    path('search-stocks/', search_stocks, name='search-stocks'),
    path('test-recommendations/', test_recommendations, name='test-recommendations'),
    path('investment-recommendations/', get_investment_recommendations, name='investment-recommendations'),
    path('recommendations/', get_user_recommendations, name='user-recommendations'),
    path('recommendations/refresh/', refresh_user_recommendation, name='refresh-recommendation'),
    path('recommendations/details/', get_recommendation_details, name='recommendation-details'),
    path('recommendations/details', get_recommendation_details, name='recommendation-details-no-slash'),
    path('recommendation-details/', get_recommendation_details, name='recommendation-details-alt'),
    path('recommendation-details', get_recommendation_details, name='recommendation-details-alt-no-slash'),
    
    # Add a direct path for dashboard recommendation details
    path('dashboard/recommendation-details/', get_recommendation_details, name='dashboard-recommendation-details'),
    path('dashboard/recommendation-details', get_recommendation_details, name='dashboard-recommendation-details-no-slash'),
    path('dashboard/recommendations/details/', get_recommendation_details, name='dashboard-recommendations-details'),
    path('dashboard/recommendations/details', get_recommendation_details, name='dashboard-recommendations-details-no-slash'),
    
    path('test-user-recommendations/', test_user_recommendations, name='test-user-recommendations'),
    path('fix-media-structure/', fix_media_structure, name='fix-media-structure'),
]

# Course URLs
urlpatterns += [
    path('courses/', views.CourseListView.as_view(), name='course-list'),
    path('courses/<str:course_id>/', views.CourseDetailView.as_view(), name='course-detail'),
    path('courses/<str:course_id>/enroll/', views.CourseEnrollmentView.as_view(), name='course-enroll'),
    path('courses/<str:course_id>/quiz/', views.QuizSubmissionView.as_view(), name='quiz-submission'),
    path('enrollments/', views.UserEnrollmentsView.as_view(), name='user-enrollments'),
]
