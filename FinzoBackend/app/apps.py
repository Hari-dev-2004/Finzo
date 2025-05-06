from django.apps import AppConfig
import logging
import sys

logger = logging.getLogger(__name__)

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'
    
    def ready(self):
        """
        Method that's run when the app is ready.
        This will:
        1. Start the recommendation scheduler (data collection will be run manually)
        """
        # Prevent running twice in development (due to reloader)
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            # Only execute in regular runtime environments, not during tests,
            # migrations, collect static, etc.
            if 'test' not in sys.argv and 'collectstatic' not in sys.argv and not any(cmd in ' '.join(sys.argv) for cmd in ['migrate', 'makemigrations', 'shell']):
                try:
                    # REMOVED: Data collection on startup (will be run manually)
                    # Just start the recommendation scheduler
                    logger.info("Starting recommendation scheduler (data collection will be run manually)...")
                    from .recommendation_scheduler import start
                    start()
                    
                except Exception as e:
                    logger.error(f"Error in app initialization: {e}")
