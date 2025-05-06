import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from app.utils import get_nse_stock_list, get_stock_details, get_mutual_fund_list
from app.models import StockData, MutualFundData

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetches and stores financial data (stocks and mutual funds)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--stocks-only',
            action='store_true',
            help='Fetch only stock data',
        )
        parser.add_argument(
            '--mf-only',
            action='store_true',
            help='Fetch only mutual fund data',
        )

    def handle(self, *args, **options):
        fetch_stocks = not options['mf_only']
        fetch_mf = not options['stocks_only']
        
        if fetch_stocks:
            self.fetch_stock_data()
        
        if fetch_mf:
            self.fetch_mutual_fund_data()
            
        self.stdout.write(self.style.SUCCESS('Successfully fetched and stored financial data'))
    
    def fetch_stock_data(self):
        self.stdout.write('Fetching stock data...')
        try:
            # Get list of stocks
            stocks = get_nse_stock_list()
            count = 0
            
            for stock in stocks[:100]:  # Limit to first 100 stocks for performance
                try:
                    symbol = stock.get('symbol')
                    if not symbol:
                        continue
                        
                    # Get detailed stock data
                    details = get_stock_details(symbol)
                    if not details:
                        continue
                    
                    # Store in database
                    StockData.objects.update_or_create(
                        symbol=symbol,
                        defaults={
                            'name': stock.get('name', ''),
                            'data': details,
                            'last_updated': timezone.now()
                        }
                    )
                    count += 1
                    
                except Exception as e:
                    logger.error(f"Error processing stock {stock.get('symbol')}: {str(e)}")
            
            self.stdout.write(self.style.SUCCESS(f'Successfully processed {count} stocks'))
        except Exception as e:
            logger.error(f"Failed to fetch stock data: {str(e)}")
            self.stdout.write(self.style.ERROR(f'Failed to fetch stock data: {str(e)}'))
    
    def fetch_mutual_fund_data(self):
        self.stdout.write('Fetching mutual fund data...')
        try:
            # Get list of mutual funds
            mutual_funds = get_mutual_fund_list()
            count = 0
            
            for mf in mutual_funds:
                try:
                    scheme_code = mf.get('scheme_code')
                    if not scheme_code:
                        continue
                    
                    # Store in database
                    MutualFundData.objects.update_or_create(
                        scheme_code=scheme_code,
                        defaults={
                            'scheme_name': mf.get('scheme_name', ''),
                            'data': mf,
                            'last_updated': timezone.now()
                        }
                    )
                    count += 1
                    
                except Exception as e:
                    logger.error(f"Error processing mutual fund {mf.get('scheme_name')}: {str(e)}")
            
            self.stdout.write(self.style.SUCCESS(f'Successfully processed {count} mutual funds'))
        except Exception as e:
            logger.error(f"Failed to fetch mutual fund data: {str(e)}")
            self.stdout.write(self.style.ERROR(f'Failed to fetch mutual fund data: {str(e)}')) 