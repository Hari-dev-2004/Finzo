from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from app.views import get_recommendation_details  # Import the view directly

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('app.urls')),  # Include app's URLs under /api/
    # Add a direct path for the problematic endpoint
    path('api/dashboard/recommendation-details', get_recommendation_details, name='direct-recommendation-details'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)