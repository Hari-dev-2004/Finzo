import logging
import time
import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Collects comprehensive financial data from multiple sources and stores it for recommendation system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--stocks',
            type=str,
            help='Comma-separated list of stock symbols to process (e.g., "RELIANCE,TCS,HDFCBANK")',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Number of stocks to process (default: 50)',
        )
        parser.add_argument(
            '--top-only',
            action='store_true',
            help='Only process top stocks from NIFTY indexes',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        
        # Get options
        stock_list = options.get('stocks')
        limit = options.get('limit')
        top_only = options.get('top_only')
        
        # Ensure data directory exists
        from app.data_collector import ensure_data_directory_exists
        data_dir = ensure_data_directory_exists()
        self.stdout.write(f"Using data directory: {data_dir}")
        
        try:
            from app.data_collector import (
                fetch_nse_stock_list, 
                process_stock_details_with_fallbacks,
                fetch_multi_source_fundamentals
            )
            
            # Get stock list
            if stock_list:
                # Use provided stock list
                stocks = [{'symbol': s.strip()} for s in stock_list.split(',')]
                self.stdout.write(f"Processing {len(stocks)} specified stocks")
            else:
                # Get stocks from NSE
                self.stdout.write("Fetching stock list from NSE...")
                stocks = fetch_nse_stock_list()
                if not stocks:
                    self.stdout.write(self.style.ERROR("Failed to fetch stock list"))
                    return
                
                # Filter for specific stocks if requested
                if top_only:
                    # Top stocks from NIFTY indexes (example)
                    top_symbols = [
                        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
                        'HDFC', 'ITC', 'KOTAKBANK', 'LT', 'SBIN', 
                        'AXISBANK', 'BHARTIARTL', 'HINDUNILVR', 'ASIANPAINT', 'MARUTI'
                    ]
                    stocks = [stock for stock in stocks if stock.get('symbol') in top_symbols]
                    self.stdout.write(f"Filtered to {len(stocks)} top stocks")
                
                # Apply limit
                if limit and limit < len(stocks):
                    stocks = stocks[:limit]
                
                self.stdout.write(f"Processing {len(stocks)} stocks (from total of {len(stocks)} available)")
            
            # Output file
            output_file = os.path.join(data_dir, 'stock_details_comprehensive.csv')
            
            # Process stocks and save to CSV
            self.stdout.write("Starting multi-source data collection")
            stock_details = process_stock_details_with_fallbacks(stocks, output_file)
            
            # Log outcome
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.SUCCESS(
                    f"Data collection completed in {elapsed_time:.2f} seconds. "
                    f"Processed {len(stock_details)} stocks with comprehensive data."
                )
            )
            
            # Optionally collect individual symbols for testing specific stocks
            if stock_list and ',' not in stock_list and len(stock_list.strip()) > 0:
                test_symbol = stock_list.strip()
                self.stdout.write(f"Fetching detailed data for test symbol: {test_symbol}")
                details = fetch_multi_source_fundamentals(test_symbol)
                
                # Display collected metrics for verification
                self.stdout.write("\nCollected metrics:")
                for key, value in details.items():
                    self.stdout.write(f"  {key}: {value}")
                
                # Highlight critical metrics
                key_metrics = ['Current Ratio', 'Interest Coverage Ratio', 'Pledged Percentage', 
                              'ROE', 'ROCE', 'Operating Profit Margin', 'Debt to Equity']
                
                self.stdout.write("\nCritical metrics summary:")
                for metric in key_metrics:
                    if metric in details:
                        self.stdout.write(f"  {metric}: {details[metric]}")
                    else:
                        self.stdout.write(self.style.WARNING(f"  {metric}: Not available"))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error during multi-source data collection: {str(e)}")
            )
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.ERROR(f"Data collection failed after {elapsed_time:.2f} seconds")
            ) 