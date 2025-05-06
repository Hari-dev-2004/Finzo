import logging
import time
import os
import pandas as pd
from django.core.management.base import BaseCommand
from django.conf import settings
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Collects and stores detailed screener data for stocks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--stocks',
            type=str,
            help='Comma-separated list of stock symbols to process (e.g., "RELIANCE,TCS,HDFCBANK")',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Number of stocks to process (default: 100)',
        )
        parser.add_argument(
            '--batch',
            type=int,
            default=5,
            help='Batch size for processing stocks concurrently (default: 5)',
        )
        parser.add_argument(
            '--workers',
            type=int,
            default=3,
            help='Number of worker threads (default: 3)',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=3.0,
            help='Delay between batch requests in seconds (default: 3.0)',
        )

    def handle(self, *args, **options):
        start_time = time.time()
        
        # Get options
        stock_list = options.get('stocks')
        limit = options.get('limit')
        batch_size = options.get('batch')
        workers = options.get('workers')
        delay = options.get('delay')
        
        # Create data directory if it doesn't exist
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            self.stdout.write(f"Created data directory at {data_dir}")
        
        try:
            from app.data_collector import fetch_nse_stock_list, fetch_screener_data
            
            # Get stock list
            if stock_list:
                # Use provided stock list
                symbols = [s.strip() for s in stock_list.split(',')]
                self.stdout.write(f"Processing {len(symbols)} specified stocks")
            else:
                # Get stocks from NSE
                self.stdout.write("Fetching stock list from NSE...")
                stocks = fetch_nse_stock_list()
                if not stocks:
                    self.stdout.write(self.style.ERROR("Failed to fetch stock list"))
                    return
                
                # Extract symbols and limit
                symbols = [stock.get('symbol') for stock in stocks if stock.get('symbol')]
                if limit and limit < len(symbols):
                    symbols = symbols[:limit]
                
                self.stdout.write(f"Processing {len(symbols)} stocks (from total of {len(stocks)} available)")
            
            # Process stocks in batches
            all_stock_details = []
            processed = 0
            batch_count = 0
            
            for i in range(0, len(symbols), batch_size):
                batch_count += 1
                batch = symbols[i:i+batch_size]
                self.stdout.write(f"Processing batch {batch_count} ({i+1}-{min(i+batch_size, len(symbols))} of {len(symbols)} stocks)")
                
                # Use concurrent execution with limited workers
                with ThreadPoolExecutor(max_workers=workers) as executor:
                    future_to_symbol = {executor.submit(fetch_screener_data, symbol): symbol for symbol in batch}
                    
                    for future in as_completed(future_to_symbol):
                        symbol = future_to_symbol[future]
                        try:
                            stock_detail = future.result()
                            if stock_detail:
                                # Add the symbol to the details
                                stock_detail['symbol'] = symbol
                                all_stock_details.append(stock_detail)
                                processed += 1
                                self.stdout.write(f"  Processed {symbol}: {len(stock_detail)} data points")
                            else:
                                self.stdout.write(self.style.WARNING(f"  No data found for {symbol}"))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"  Error processing {symbol}: {str(e)}"))
                
                # Save intermediate results
                if all_stock_details:
                    output_file = os.path.join(data_dir, 'stock_details.csv')
                    pd.DataFrame(all_stock_details).to_csv(output_file, index=False)
                    self.stdout.write(f"Saved intermediate batch with {len(all_stock_details)} stocks to {output_file}")
                
                # Pause between batches to avoid rate limiting
                if i + batch_size < len(symbols):
                    self.stdout.write("Pausing between batches to avoid rate limiting...")
                    time.sleep(delay)
            
            # Final save
            if all_stock_details:
                output_file = os.path.join(data_dir, 'stock_details.csv')
                pd.DataFrame(all_stock_details).to_csv(output_file, index=False)
                self.stdout.write(self.style.SUCCESS(f"Saved final dataset with {len(all_stock_details)} stocks to {output_file}"))
            else:
                self.stdout.write(self.style.ERROR("No stock details were successfully processed"))
            
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.SUCCESS(f"Screener data collection completed in {elapsed_time:.2f} seconds. Processed {processed} stocks.")
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error during screener data collection: {str(e)}")
            )
            elapsed_time = time.time() - start_time
            self.stdout.write(
                self.style.ERROR(f"Data collection failed after {elapsed_time:.2f} seconds")
            ) 