import logging
import time
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Collects and stores all financial data from external sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force data collection even if existing data is recent',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        force = options.get('force', False)
        
        try:
            from app.data_collector import fetch_and_store_all_data
            
            self.stdout.write("Starting to collect financial data. This may take several minutes...")
            
            # Run the data collection function
            result = fetch_and_store_all_data()
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS("Successfully collected and stored all financial data")
                )
            else:
                self.stdout.write(
                    self.style.ERROR("Failed to collect all financial data. Check logs for details.")
                )
                
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.SUCCESS(f"Data collection process completed in {elapsed_time:.2f} seconds")
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error during data collection: {str(e)}")
            )
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.ERROR(f"Data collection failed after {elapsed_time:.2f} seconds")
            ) 