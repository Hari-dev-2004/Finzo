import logging
import time
from datetime import datetime

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Updates investment recommendations for all users with financial profiles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Update recommendations for a specific user ID only',
        )
        parser.add_argument(
            '--update-data',
            action='store_true',
            help='Update financial data before generating recommendations',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        
        user_id = options.get('user_id')
        update_data = options.get('update_data')
        
        if update_data:
            self.update_financial_data()
            
        self.update_recommendations(user_id)
            
        elapsed_time = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(f'Recommendation update completed in {elapsed_time:.2f} seconds')
        )
    
    def update_financial_data(self):
        """Update financial data before generating recommendations"""
        self.stdout.write('Updating financial data...')
        try:
            from app.data_collector import fetch_and_store_all_data
            
            result = fetch_and_store_all_data()
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS('Financial data update completed successfully')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('Financial data update failed or partially completed')
                )
        except ImportError:
            self.stdout.write(
                self.style.ERROR('data_collector module not available. Make sure it exists in the app directory.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating financial data: {str(e)}')
            )

    def update_recommendations(self, user_id=None):
        """Update recommendations for users"""
        self.stdout.write('Updating user recommendations...')
        try:
            from app.recommendation_scheduler import update_user_recommendations
            from app.models import CustomUser, FinancialProfile
            
            if user_id:
                # Update for a specific user
                try:
                    user = CustomUser.objects.get(id=user_id)
                    profile = FinancialProfile.objects.get(user=user)
                    
                    self.stdout.write(f'Updating recommendations for user {user.email}...')
                    
                    from app.recommendation_scheduler import (
                        update_stock_recommendations,
                        update_mutual_fund_recommendations,
                        update_sip_recommendations,
                        update_fixed_income_recommendations
                    )
                    
                    update_stock_recommendations(user, profile)
                    update_mutual_fund_recommendations(user, profile)
                    update_sip_recommendations(user, profile)
                    update_fixed_income_recommendations(user, profile)
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully updated recommendations for user {user.email}')
                    )
                    
                except CustomUser.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'User with ID {user_id} does not exist')
                    )
                except FinancialProfile.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'Financial profile not found for user with ID {user_id}')
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error updating recommendations for user with ID {user_id}: {str(e)}')
                    )
            else:
                # Update for all users
                update_user_recommendations()
                self.stdout.write(
                    self.style.SUCCESS('Successfully updated recommendations for all users')
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error updating recommendations: {str(e)}')
            ) 