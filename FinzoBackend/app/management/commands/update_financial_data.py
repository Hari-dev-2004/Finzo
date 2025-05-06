import logging
import time
from datetime import datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from app.utils import get_nse_stock_list, get_stock_details, get_mutual_fund_list
from app.models import StockData, MutualFundData

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetches the latest financial data (stocks and mutual funds) and stores it in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--stocks-only',
            action='store_true',
            help='Update only stock data',
        )
        parser.add_argument(
            '--funds-only',
            action='store_true',
            help='Update only mutual fund data',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of stocks/funds to update (for testing)',
        )
        parser.add_argument(
            '--use-collector',
            action='store_true',
            help='Use the data_collector module for comprehensive data collection',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        
        stocks_only = options['stocks_only']
        funds_only = options['funds_only']
        limit = options['limit']
        use_collector = options['use_collector']
        
        if use_collector:
            self.use_data_collector()
        else:
            if not stocks_only:
                self.update_mutual_funds(limit)
            
            if not funds_only:
                self.update_stocks(limit)
            
        elapsed_time = time.time() - start_time
        self.stdout.write(
            self.style.SUCCESS(f'Financial data update completed in {elapsed_time:.2f} seconds')
        )
    
    def use_data_collector(self):
        """Use the data_collector module for comprehensive data collection"""
        self.stdout.write('Starting comprehensive data collection using data_collector module...')
        try:
            from app.data_collector import fetch_and_store_all_data
            
            result = fetch_and_store_all_data()
            
            if result:
                self.stdout.write(
                    self.style.SUCCESS('Comprehensive data collection completed successfully')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('Comprehensive data collection failed')
                )
        except ImportError:
            self.stdout.write(
                self.style.ERROR('data_collector module not available. Make sure it exists in the app directory.')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during comprehensive data collection: {str(e)}')
            )

    def update_stocks(self, limit=None):
        self.stdout.write('Fetching stock list...')
        try:
            stock_list = get_nse_stock_list()
            
            if limit:
                stock_list = stock_list[:limit]
                
            total_stocks = len(stock_list)
            self.stdout.write(f'Found {total_stocks} stocks. Starting update...')
            
            updated_count = 0
            failed_count = 0
            
            # Process stocks in batches to avoid overwhelming the API
            batch_size = 100
            for i in range(0, total_stocks, batch_size):
                batch = stock_list[i:i+batch_size]
                self.stdout.write(f'Processing batch {i//batch_size + 1} ({len(batch)} stocks)...')
                
                for stock in batch:
                    try:
                        symbol = stock['symbol']
                        self.stdout.write(f'Updating {symbol}...', ending='\r')
                        
                        # Get detailed stock data
                        stock_details = get_stock_details(symbol)
                        if not stock_details:
                            failed_count += 1
                            logger.warning(f"Failed to fetch details for stock {symbol}")
                            continue
                        
                        # Create or update the stock data in the database
                        with transaction.atomic():
                            StockData.objects.update_or_create(
                                symbol=symbol,
                                defaults={
                                    'name': stock.get('name', symbol),
                                    'data': {
                                        'basic_info': stock,
                                        'details': stock_details,
                                        'fetched_at': datetime.now().isoformat()
                                    }
                                }
                            )
                        updated_count += 1
                    except Exception as e:
                        failed_count += 1
                        logger.error(f"Error updating stock {symbol}: {str(e)}")
                
                # Sleep between batches to avoid rate limiting
                if i + batch_size < total_stocks:
                    time.sleep(2)
                    
            self.stdout.write(
                self.style.SUCCESS(f'Stock update complete. Updated: {updated_count}, Failed: {failed_count}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during stock update: {str(e)}')
            )

    def update_mutual_funds(self, limit=None):
        self.stdout.write('Fetching mutual fund list...')
        try:
            fund_list = get_mutual_fund_list()
            
            if limit:
                fund_list = fund_list[:limit]
                
            total_funds = len(fund_list)
            self.stdout.write(f'Found {total_funds} mutual funds. Starting update...')
            
            updated_count = 0
            failed_count = 0
            
            for fund in fund_list:
                try:
                    scheme_code = fund.get('scheme_code')
                    if not scheme_code:
                        failed_count += 1
                        continue
                        
                    self.stdout.write(f'Updating fund {scheme_code}...', ending='\r')
                    
                    # Create or update the mutual fund data in the database
                    with transaction.atomic():
                        MutualFundData.objects.update_or_create(
                            scheme_code=scheme_code,
                            defaults={
                                'scheme_name': fund.get('scheme_name', ''),
                                'data': {
                                    **fund,
                                    'fetched_at': datetime.now().isoformat()
                                }
                            }
                        )
                    updated_count += 1
                except Exception as e:
                    failed_count += 1
                    logger.error(f"Error updating mutual fund {scheme_code}: {str(e)}")
            
            self.stdout.write(
                self.style.SUCCESS(f'Mutual fund update complete. Updated: {updated_count}, Failed: {failed_count}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error during mutual fund update: {str(e)}')
            ) 