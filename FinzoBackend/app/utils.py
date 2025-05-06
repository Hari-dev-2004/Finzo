import requests
import json
import logging
import csv
from io import StringIO
from datetime import datetime, timedelta
from django.core.cache import cache
from bs4 import BeautifulSoup
import pandas as pd
import concurrent.futures
import os
import time
import random

logger = logging.getLogger(__name__)

# CSV data paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')

def load_from_csv(filename):
    """
    Load data from a CSV file in the data directory
    
    Args:
        filename (str): Name of the CSV file to load
    
    Returns:
        list: List of dictionaries with data from CSV, or None if file doesn't exist
    """
    try:
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        filepath = os.path.join(data_dir, filename)
        
        if not os.path.exists(filepath):
            logger.warning(f"CSV file not found: {filepath}")
            return None
            
        df = pd.read_csv(filepath)
        
        # Convert any JSON strings back to dictionaries
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    # Try to parse strings that look like JSON
                    mask = df[col].str.contains(r'^\{.*\}$', na=False, regex=True)
                    if mask.any():
                        df.loc[mask, col] = df.loc[mask, col].apply(json.loads)
                except:
                    pass  # Skip if column can't be processed
        
        data = df.to_dict('records')
        logger.info(f"Successfully loaded {len(data)} records from {filename}")
        return data
    except Exception as e:
        logger.error(f"Error loading data from CSV file {filename}: {str(e)}")
        return None

def get_nse_stock_list():
    """
    Get the list of stocks listed on NSE
    
    Returns:
        list: List of dictionaries with stock details
    """
    
    # Try to load from cache first
    cache_key = 'nse_stock_list'
    cached_data = cache.get(cache_key)
    if cached_data:
        logger.info("Using cached NSE stock list")
        return cached_data
    
    # If cache doesn't exist, fetch from NSE
    from .data_collection import fetch_nse_stock_list
    
    # First try to load from CSV file
    stocks = load_from_csv('stocks.csv')
    if stocks:
        logger.info(f"Loaded {len(stocks)} stocks from CSV file")
        return stocks
    
    # If not available in CSV, fetch from API
    cache_key = 'nse_stock_list'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info(f"Using cached NSE stock list with {len(cached_data)} stocks")
        return cached_data
    
    try:
        # Use the data_collection implementation if available
        from .data_collection import fetch_nse_stock_list
        
        # Try to get from cache first (data_collection also checks cache)
        cached_stocks = cache.get('nse_stock_list')
        if cached_stocks:
            return cached_stocks
            
        # Use the data_collection function to get fresh data
        stock_list = fetch_nse_stock_list()
        return stock_list
    except ImportError:
        logger.warning("data_collection module not available, using fallback implementation")
        
        # Try to get from cache first
        cached_stocks = cache.get('nse_stock_list')
        if cached_stocks:
            return cached_stocks
        
        try:
            # NSE provides a CSV with all listed securities - primary source
            primary_url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
            
            # Backup URLs in case the primary fails
            backup_urls = [
                "https://www1.nseindia.com/content/equities/EQUITY_L.csv",
                "https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O"
            ]
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br'
            }
            
            stocks = None
            
            # Try primary URL first
            try:
                logger.info(f"Fetching NSE stock list from primary source: {primary_url}")
                response = requests.get(primary_url, headers=headers, timeout=15)
                response.raise_for_status()
                
                # Process CSV data
                csv_data = StringIO(response.text)
                reader = csv.DictReader(csv_data)
                
                stocks = []
                for row in reader:
                    # Make sure we have both SYMBOL and NAME OF COMPANY
                    if 'SYMBOL' in row and 'NAME OF COMPANY' in row:
                        stock = {
                            'symbol': row['SYMBOL'],
                            'company_name': row['NAME OF COMPANY'],
                            'series': row.get('SERIES', ''),
                            'isin': row.get('ISIN NUMBER', '')
                        }
                        stocks.append(stock)
                
                # Filter only valid equity shares (EQ series)
                stocks = [s for s in stocks if s.get('series') == 'EQ']
                logger.info(f"Successfully fetched {len(stocks)} stocks from primary source")
                
            except Exception as e:
                logger.warning(f"Failed to fetch from primary URL: {str(e)}")
                
                # Try each backup URL until we get a successful response
                for url in backup_urls:
                    try:
                        logger.info(f"Trying backup source: {url}")
                        response = requests.get(url, headers=headers, timeout=15)
                        response.raise_for_status()
                        
                        # If we reached the JSON API endpoint
                        if url.endswith("SECURITIES%20IN%20F%26O"):
                            data = response.json()
                            stocks = []
                            for item in data.get('data', []):
                                stock = {
                                    'symbol': item.get('symbol', ''),
                                    'company_name': item.get('meta', {}).get('companyName', ''),
                                    'series': 'EQ',
                                    'isin': item.get('meta', {}).get('isin', '')
                                }
                                stocks.append(stock)
                            logger.info(f"Successfully fetched {len(stocks)} stocks from F&O API")
                            break
                        else:
                            # Process CSV data
                            csv_data = StringIO(response.text)
                            reader = csv.DictReader(csv_data)
                            
                            stocks = []
                            for row in reader:
                                # Make sure we have both SYMBOL and NAME OF COMPANY
                                if 'SYMBOL' in row and 'NAME OF COMPANY' in row:
                                    stock = {
                                        'symbol': row['SYMBOL'],
                                        'company_name': row['NAME OF COMPANY'],
                                        'series': row.get('SERIES', ''),
                                        'isin': row.get('ISIN NUMBER', '')
                                    }
                                    stocks.append(stock)
                            
                            # Filter only valid equity shares (EQ series)
                            stocks = [s for s in stocks if s.get('series') == 'EQ']
                            logger.info(f"Successfully fetched {len(stocks)} stocks from backup CSV source")
                            break
                            
                    except Exception as e:
                        logger.warning(f"Failed to fetch from {url}: {str(e)}")
                        continue
            
            # If we didn't get any data from any URL, raise exception
            if not stocks:
                raise Exception("Failed to fetch stock list from any source")
            
            # Verify we have all the required fields
            for stock in stocks:
                if not stock.get('symbol') or not stock.get('company_name'):
                    logger.warning(f"Stock missing required fields: {stock}")
            
            # Log the number of stocks fetched
            logger.info(f"Total stocks retrieved: {len(stocks)}")
            
            # Cache for 24 hours
            cache.set('nse_stock_list', stocks, 60*60*24)
            
            return stocks
        except Exception as e:
            logger.error(f"Error fetching NSE stock list: {str(e)}")
            # Return a minimal test dataset in case of error
            return [
                {'symbol': 'RELIANCE', 'company_name': 'Reliance Industries Ltd.', 'series': 'EQ', 'isin': 'INE002A01018'},
                {'symbol': 'TCS', 'company_name': 'Tata Consultancy Services Ltd.', 'series': 'EQ', 'isin': 'INE467B01029'},
                {'symbol': 'HDFCBANK', 'company_name': 'HDFC Bank Ltd.', 'series': 'EQ', 'isin': 'INE040A01034'},
                {'symbol': 'INFY', 'company_name': 'Infosys Ltd.', 'series': 'EQ', 'isin': 'INE009A01021'},
                {'symbol': 'HDFC', 'company_name': 'Housing Development Finance Corporation Ltd.', 'series': 'EQ', 'isin': 'INE001A01036'}
            ]

def get_stock_details(symbol):
    """
    Get detailed information for a specific stock
    Returns a dictionary with stock details
    """
    # First try to load from CSV file
    stock_details = load_from_csv('stock_details.csv')
    if stock_details:
        # Find the specific stock
        for stock in stock_details:
            if stock['symbol'] == symbol:
                logger.info(f"Loaded details for {symbol} from CSV file")
                return stock
                
    # If not available in CSV, fetch from API
    cache_key = f'stock_details_{symbol}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info(f"Using cached details for {symbol}")
        return cached_data
        
    try:
        # Use the data_collection implementation if available
        from .data_collection import fetch_stock_price_data, fetch_stock_fundamental_data
        
        # Get price data
        price_data = fetch_stock_price_data(symbol)
        
        # Get fundamental data
        fundamental_data = fetch_stock_fundamental_data(symbol)
        
        if price_data is None or fundamental_data is None:
            logger.warning(f"Could not get stock data for {symbol}")
            return {}
            
        # Extract the most recent price
        current_price = price_data['Close'].iloc[-1] if not price_data.empty else 0
        
        # Convert fundamental data format to match expected output format
        details = {
            'current_price': current_price,
            'market_cap': fundamental_data.get('Market Cap', 0),
            'pe_ratio': fundamental_data.get('PE Ratio', 0),
            'price_to_book': fundamental_data.get('PB Ratio', 0),
            'dividend_yield': fundamental_data.get('Dividend Yield', 0),
            'return_on_equity': fundamental_data.get('ROE', 0),
            'debt_to_equity': fundamental_data.get('Debt to Equity', 0),
            'revenue_growth': fundamental_data.get('Revenue Growth', 0),
            'profit_margin': fundamental_data.get('Profit Margin', 0),
            'sector': fundamental_data.get('Sector', '')
        }
        
        # Cache the results
        cache.set(cache_key, details, 60*60)  # 1 hour cache
        
        return details
    except ImportError:
        logger.warning("data_collection module not available, using fallback implementation")
        
        # Try cache first
        cache_key = f'stock_details_{symbol}'
        cached_details = cache.get(cache_key)
        if cached_details:
            return cached_details
            
        try:
            # Attempt to get data from multiple sources for redundancy
            details = None
            
            # First try using NSE data API
            try:
                # Create a session to handle cookies
                session = requests.Session()
                
                # Set headers to mimic a browser
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate, br'
                }
                
                # First hit the homepage to get cookies
                session.get("https://www.nseindia.com/", headers=headers, timeout=10)
                
                # Try both possible API endpoints
                api_urls = [
                    f"https://www.nseindia.com/api/quote-equity?symbol={symbol}",
                    f"https://www.nseindia.com/get-quotes/equity?symbol={symbol}"
                ]
                
                for url in api_urls:
                    try:
                        response = session.get(url, headers=headers, timeout=10)
                        response.raise_for_status()
                        
                        data = response.json()
                        
                        details = {
                            'current_price': data.get('priceInfo', {}).get('lastPrice', 0),
                            'market_cap': data.get('securityInfo', {}).get('marketCap', 0),
                            'pe_ratio': data.get('metadata', {}).get('pdPe', 0),
                            'price_to_book': data.get('metadata', {}).get('pdPb', 0),
                            'dividend_yield': data.get('metadata', {}).get('yield', 0),
                            'high_52_week': data.get('priceInfo', {}).get('high52', 0),
                            'low_52_week': data.get('priceInfo', {}).get('low52', 0),
                            'sector': data.get('metadata', {}).get('industry', ''),
                            'volume': data.get('preOpenMarket', {}).get('totalTradedVolume', 0),
                            'face_value': data.get('securityInfo', {}).get('faceValue', 0)
                        }
                        break
                    except Exception:
                        continue
            except Exception as e:
                logger.warning(f"Error fetching NSE data for {symbol}: {str(e)}")
            
            # If NSE fails, try screener.in as fallback
            if not details:
                try:
                    url = f"https://www.screener.in/api/company/{symbol}/"
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                    
                    response = requests.get(url, headers=headers, timeout=10)
                    response.raise_for_status()
                    
                    data = response.json()
                    
                    # Extract key ratios
                    ratios = data.get('ratios', {})
                    
                    details = {
                        'current_price': data.get('current_price', 0),
                        'market_cap': ratios.get('Market Cap', 0),
                        'pe_ratio': ratios.get('PE', 0),
                        'price_to_book': ratios.get('Price to Book', 0),
                        'dividend_yield': ratios.get('Div Yield', 0),
                        'return_on_equity': ratios.get('ROE', 0),
                        'debt_to_equity': ratios.get('Debt to Equity', 0),
                        'revenue_growth': ratios.get('Sales Growth', 0),
                        'profit_growth': ratios.get('Profit Growth', 0),
                        'sector': data.get('warehouse_set', {}).get('industry', '')
                    }
                except Exception as e:
                    logger.warning(f"Error fetching screener.in data for {symbol}: {str(e)}")
            
            # Try yfinance as a third fallback option
            if not details:
                try:
                    import yfinance as yf
                    ticker = symbol
                    if not (ticker.endswith('.NS') or ticker.endswith('.BO')):
                        ticker = f"{ticker}.NS"
                    
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    
                    details = {
                        'current_price': info.get('currentPrice', info.get('previousClose', 0)),
                        'market_cap': info.get('marketCap', 0),
                        'pe_ratio': info.get('trailingPE', 0),
                        'price_to_book': info.get('priceToBook', 0),
                        'dividend_yield': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0,
                        'return_on_equity': info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0,
                        'debt_to_equity': info.get('debtToEquity', 0),
                        'sector': info.get('sector', ''),
                        'high_52_week': info.get('fiftyTwoWeekHigh', 0),
                        'low_52_week': info.get('fiftyTwoWeekLow', 0)
                    }
                except Exception as e:
                    logger.warning(f"Error fetching yfinance data for {symbol}: {str(e)}")
            
            # If all sources fail, return default data
            if not details:
                return {
                    'current_price': 0,
                    'market_cap': 0,
                    'pe_ratio': 0,
                    'price_to_book': 0,
                    'dividend_yield': 0,
                    'return_on_equity': 0,
                    'debt_to_equity': 0,
                    'sector': 'Unknown'
                }
            
            # Cache for 6 hours
            cache.set(cache_key, details, 60*60*6)
            
            return details
        except Exception as e:
            logger.error(f"Error fetching details for stock {symbol}: {str(e)}")
            # Return some default data
            return {
                'current_price': 0,
                'market_cap': 0,
                'pe_ratio': 0,
                'price_to_book': 0,
                'dividend_yield': 0,
                'return_on_equity': 0,
                'debt_to_equity': 0,
                'sector': 'Unknown'
            }

def get_mutual_fund_list():
    """
    Get list of mutual funds
    
    Returns:
        list: List of dictionaries with mutual fund details
    """
    
    # First try to load from CSV file
    mutual_funds = load_from_csv('mutual_funds.csv')
    if mutual_funds:
        logger.info(f"Loaded {len(mutual_funds)} mutual funds from CSV file")
        return mutual_funds
    
    # If not available in CSV, fetch from API
    cache_key = 'mutual_fund_list'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        logger.info(f"Using cached mutual fund list with {len(cached_data)} funds")
        return cached_data
    
    try:
        # Use the data_collection implementation if available
        from .data_collection import fetch_mutual_fund_list
        
        # Try to get from cache first (data_collection also checks cache)
        cached_funds = cache.get('mutual_fund_list')
        if cached_funds:
            return cached_funds
            
        # Use the data_collection function to get fresh data
        mutual_fund_list = fetch_mutual_fund_list()
        return mutual_fund_list
    except ImportError:
        logger.warning("data_collection module not available, using fallback implementation")
        
        # Try to get from cache first
        cached_funds = cache.get('mutual_fund_list')
        if cached_funds:
            return cached_funds
        
        try:
            # Try to fetch from AMFI API first
            url = "https://www.amfiindia.com/spages/NAVAll.txt"
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            
            funds = []
            lines = response.text.strip().split('\n')
            current_scheme_type = ""
            
            for line in lines:
                if line.startswith(';'):
                    current_scheme_type = line.strip(';').strip()
                    continue
                    
                if not line or line.startswith('Scheme Code'):
                    continue
                    
                parts = line.split(';')
                if len(parts) >= 5:
                    try:
                        fund = {
                            'scheme_code': parts[0].strip(),
                            'name': parts[3].strip(),
                            'category': current_scheme_type,
                            'nav': float(parts[4].strip() or 0),
                            'last_updated': parts[5].strip() if len(parts) > 5 else '',
                        }
                        funds.append(fund)
                    except (ValueError, IndexError):
                        continue
            
            # Filter out debt funds and keep only equity, hybrid, and solution-oriented funds
            filtered_funds = [fund for fund in funds if any(category in fund['category'].lower() 
                                                         for category in ['equity', 'hybrid', 'solution', 'balanced'])]
            
            # Make sure we have at least some funds
            if not filtered_funds:
                raise Exception("No mutual funds found in AMFI data after filtering")
            
            # Cache for 24 hours
            cache.set('mutual_fund_list', filtered_funds, 60*60*24)
            
            return filtered_funds
        except Exception as e:
            logger.error(f"Error fetching mutual fund list from AMFI: {str(e)}")
            
            # Try alternate sources
            try:
                # Try fetching from Mornignstar API 
                url = "https://www.morningstar.in/tools/api/categoryapi.aspx?cat_equity_all"
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                
                try:
                    data = response.json()
                    funds = []
                    
                    for item in data.get('funds', []):
                        fund = {
                            'name': item.get('fundName', ''),
                            'category': item.get('category', ''),
                            'rating': item.get('rating', 0),
                            '1y_return': item.get('1YReturn', 0),
                            '3y_return': item.get('3YReturn', 0),
                            '5y_return': item.get('5YReturn', 0),
                            'aum': item.get('aum', '')
                        }
                        funds.append(fund)
                    
                    # Cache for 24 hours
                    if funds:
                        cache.set('mutual_fund_list', funds, 60*60*24)
                        return funds
                except Exception:
                    # If Morningstar JSON parsing fails, try Value Research
                    logger.warning("Failed to parse Morningstar JSON, trying Value Research")
                    pass
                
                # Fallback to Value Research
                url = "https://www.valueresearchonline.com/funds/selector/category/equity"
                
                response = requests.get(url, headers=headers, timeout=15)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                table = soup.find('table', class_='datatable')
                
                funds = []
                if table:
                    rows = table.find_all('tr')[1:]  # Skip header row
                    for row in rows:
                        cols = row.find_all('td')
                        if len(cols) >= 7:
                            try:
                                fund = {
                                    'name': cols[0].text.strip(),
                                    'category': cols[1].text.strip(),
                                    'rating': len(cols[2].find_all('i', class_='star-icon')),
                                    '1y_return': float(cols[3].text.strip().replace('%', '') or 0),
                                    '3y_return': float(cols[4].text.strip().replace('%', '') or 0),
                                    '5y_return': float(cols[5].text.strip().replace('%', '') or 0),
                                    'aum': cols[6].text.strip()
                                }
                                funds.append(fund)
                            except (ValueError, IndexError):
                                continue
                
                # Check if we have any funds
                if not funds:
                    raise Exception("No funds found from Value Research")
                
                # Cache for 24 hours
                cache.set('mutual_fund_list', funds, 60*60*24)
                
                return funds
            except Exception as e2:
                logger.error(f"Error fetching mutual fund list from alternate sources: {str(e2)}")
                
                # Try to use yfinance as a last resort
                try:
                    import yfinance as yf
                    
                    # List of popular Indian mutual funds with their yfinance tickers
                    popular_funds = [
                        {"ticker": "0P0000XVHU.BO", "name": "HDFC Flexi Cap Fund"},
                        {"ticker": "0P0000YWCG.BO", "name": "Axis Bluechip Fund"},
                        {"ticker": "0P0000TN0D.BO", "name": "Mirae Asset Large Cap Fund"},
                        {"ticker": "0P0000X5BG.BO", "name": "SBI Small Cap Fund"},
                        {"ticker": "0P0000XW0A.BO", "name": "ICICI Prudential Bluechip Fund"}
                    ]
                    
                    funds = []
                    for fund_info in popular_funds:
                        try:
                            ticker = fund_info["ticker"]
                            name = fund_info["name"]
                            
                            fund_ticker = yf.Ticker(ticker)
                            fund_data = fund_ticker.history(period="1y")
                            
                            if not fund_data.empty:
                                # Calculate 1 year return
                                first_price = fund_data.iloc[0]['Close']
                                last_price = fund_data.iloc[-1]['Close']
                                one_y_return = ((last_price - first_price) / first_price) * 100
                                
                                fund = {
                                    'name': name,
                                    'category': 'Equity',
                                    'rating': 3,  # Default rating
                                    '1y_return': one_y_return,
                                    '3y_return': 0,  # No data
                                    '5y_return': 0,  # No data
                                    'aum': 'N/A'  # No data
                                }
                                funds.append(fund)
                        except Exception as e:
                            logger.warning(f"Error fetching fund data for {name}: {str(e)}")
                            continue
                        
                    # If we still don't have any funds, use a default list
                    if not funds:
                        funds = get_default_mutual_funds()
                        
                    # Cache for 24 hours
                    cache.set('mutual_fund_list', funds, 60*60*24)
                    return funds
                except Exception as e:
                    logger.error(f"Error using yfinance for mutual funds: {str(e)}")
                    # Last resort - return default data
                    return get_default_mutual_funds()
         
        except Exception as e:
            logger.error(f"All attempts to fetch mutual funds failed: {str(e)}")
            return get_default_mutual_funds()

def get_default_mutual_funds():
    """Return a list of default mutual funds if all other methods fail"""
    return [
        {
            'name': 'HDFC Top 100 Fund',
            'category': 'Equity: Large Cap',
            'rating': 4,
            '1y_return': 12.5,
            '3y_return': 15.2,
            '5y_return': 10.8,
            'aum': '₹ 21,000 Cr.'
        },
        {
            'name': 'Axis Bluechip Fund',
            'category': 'Equity: Large Cap',
            'rating': 5,
            '1y_return': 14.3,
            '3y_return': 16.7,
            '5y_return': 12.1,
            'aum': '₹ 18,500 Cr.'
        },
        {
            'name': 'SBI Small Cap Fund',
            'category': 'Equity: Small Cap',
            'rating': 5,
            '1y_return': 18.9,
            '3y_return': 22.3,
            '5y_return': 16.4,
            'aum': '₹ 12,000 Cr.'
        },
        {
            'name': 'Mirae Asset Large Cap Fund',
            'category': 'Equity: Large Cap',
            'rating': 4,
            '1y_return': 13.7,
            '3y_return': 17.5,
            '5y_return': 11.9,
            'aum': '₹ 25,000 Cr.'
        },
        {
            'name': 'ICICI Prudential Bluechip Fund',
            'category': 'Equity: Large Cap',
            'rating': 4,
            '1y_return': 12.8,
            '3y_return': 15.8,
            '5y_return': 11.5,
            'aum': '₹ 20,000 Cr.'
        }
    ]

def get_sip_plans():
    """
    Fetch SIP (Systematic Investment Plan) options
    Returns a list of dictionaries with SIP information
    """
    # Load from CSV file
    sip_plans = load_from_csv('sip_plans.csv')
    if sip_plans and len(sip_plans) > 0:
        logger.info(f"Loaded {len(sip_plans)} SIP plans from CSV file")
        return sip_plans
        
    # If not available in CSV, generate from mutual funds
    logger.info("SIP plans CSV file not found or empty, generating from mutual funds")
    
    try:
        # Get mutual fund list
        mutual_funds = get_mutual_fund_list()
        
        # If we have mutual funds, filter suitable ones for SIP
        if mutual_funds and len(mutual_funds) > 0:
            sip_plans = []
            
            # Convert mutual_funds to list if it's a DataFrame
            if isinstance(mutual_funds, pd.DataFrame):
                mutual_funds = mutual_funds.to_dict('records')
            
            # Filter suitable mutual funds for SIPs (typically equity and balanced funds)
            for mf in mutual_funds:
                if 'name' in mf and 'category' in mf:
                    category = mf.get('category', '').lower()
                    # Only include equity and hybrid funds for SIP
                    if any(term in category for term in ['equity', 'balanced', 'hybrid']):
                        sip_plan = {
                            'name': mf['name'],
                            'category': mf['category'],
                            'min_investment': mf.get('min_investment', 1000),
                            'returns': {
                                '1y': mf.get('1y_return', 0),
                                '3y': mf.get('3y_return', 0),
                                '5y': mf.get('5y_return', 0)
                            },
                            'risk': mf.get('risk', 'Moderate'),
                            'fund_house': mf.get('fund_house', ''),
                            'is_sip': True,
                            'lock_in_period': '0 years',
                            'exit_load': '1% if redeemed within 1 year',
                            'sip_frequency': ['Monthly', 'Quarterly']
                        }
                        sip_plans.append(sip_plan)
            
            # If we got at least some SIP plans, return them
            if sip_plans and len(sip_plans) > 0:
                logger.info(f"Generated {len(sip_plans)} SIP plans from mutual funds")
                return sip_plans
        
        # If we still don't have SIP plans, use default values
        logger.warning("No suitable mutual funds for SIP, using default plans")
        default_sip_plans = [
            {
                'name': 'HDFC Top 100 Fund', 
                'category': 'Equity: Large Cap', 
                'min_investment': 1000, 
                'returns': {'1y': 12.5, '3y': 15.2, '5y': 10.8}, 
                'risk': 'Moderate', 
                'fund_house': 'HDFC Mutual Fund',
                'is_sip': True,
                'lock_in_period': '0 years',
                'exit_load': '1% if redeemed within 1 year',
                'sip_frequency': ['Monthly', 'Quarterly']
            },
            {
                'name': 'Axis Bluechip Fund', 
                'category': 'Equity: Large Cap', 
                'min_investment': 500, 
                'returns': {'1y': 14.3, '3y': 16.7, '5y': 12.1}, 
                'risk': 'Moderate', 
                'fund_house': 'Axis Mutual Fund',
                'is_sip': True,
                'lock_in_period': '0 years',
                'exit_load': '1% if redeemed within 1 year',
                'sip_frequency': ['Monthly', 'Quarterly']
            },
            {
                'name': 'SBI Small Cap Fund', 
                'category': 'Equity: Small Cap', 
                'min_investment': 500, 
                'returns': {'1y': 18.9, '3y': 22.3, '5y': 16.4}, 
                'risk': 'High', 
                'fund_house': 'SBI Mutual Fund',
                'is_sip': True,
                'lock_in_period': '0 years',
                'exit_load': '1% if redeemed within 1 year',
                'sip_frequency': ['Monthly', 'Quarterly']
            },
            {
                'name': 'Mirae Asset Large Cap Fund', 
                'category': 'Equity: Large Cap', 
                'min_investment': 1000, 
                'returns': {'1y': 13.7, '3y': 17.5, '5y': 11.9}, 
                'risk': 'Moderate', 
                'fund_house': 'Mirae Asset Mutual Fund',
                'is_sip': True,
                'lock_in_period': '0 years',
                'exit_load': '1% if redeemed within 1 year',
                'sip_frequency': ['Monthly', 'Quarterly']
            },
            {
                'name': 'ICICI Prudential Bluechip Fund', 
                'category': 'Equity: Large Cap', 
                'min_investment': 500, 
                'returns': {'1y': 12.8, '3y': 15.8, '5y': 11.5}, 
                'risk': 'Moderate', 
                'fund_house': 'ICICI Prudential Mutual Fund',
                'is_sip': True,
                'lock_in_period': '0 years',
                'exit_load': '1% if redeemed within 1 year',
                'sip_frequency': ['Monthly', 'Quarterly']
            }
        ]
        
        logger.info(f"Using {len(default_sip_plans)} default SIP plans")
        return default_sip_plans
    except Exception as e:
        logger.error(f"Error generating SIP plans: {e}")
        return []

def get_fixed_income_options():
    """Get list of fixed income options available"""
    # Load from CSV file
    fixed_income = load_from_csv('fixed_income.csv')
    if fixed_income:
        logger.info(f"Loaded {len(fixed_income)} fixed income options from CSV file")
        return fixed_income
        
    # If not available in CSV, return default options
    logger.warning("Fixed income CSV file not found, returning default options")
    return [
        {'name': 'Fixed Deposit', 'interest_rate': 6.5, 'min_investment': 10000, 'duration': '1 year', 'risk': 'Low'},
        {'name': 'Public Provident Fund', 'interest_rate': 7.1, 'min_investment': 500, 'duration': '15 years', 'risk': 'Low'},
        {'name': 'National Savings Certificate', 'interest_rate': 6.8, 'min_investment': 1000, 'duration': '5 years', 'risk': 'Low'},
    ]

def batch_fetch_stock_details(stock_symbols, max_workers=10):
    """
    Fetch stock details for multiple stocks in parallel
    Returns a dictionary mapping symbols to their details
    """
    results = {}
    
    # Check cache first
    for symbol in stock_symbols:
        cache_key = f'stock_details_{symbol}'
        cached_details = cache.get(cache_key)
        if cached_details:
            results[symbol] = cached_details
    
    # Symbols that need to be fetched
    symbols_to_fetch = [s for s in stock_symbols if s not in results]
    
    if symbols_to_fetch:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_symbol = {executor.submit(get_stock_details, symbol): symbol for symbol in symbols_to_fetch}
            for future in concurrent.futures.as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                try:
                    details = future.result()
                    results[symbol] = details
                except Exception as e:
                    logger.error(f"Error fetching details for {symbol}: {str(e)}")
                    # Add default empty result
                    results[symbol] = {
                        'current_price': 0,
                        'error': str(e)
                    }
    
    return results 

def load_stock_details_from_csv():
    """
    Load detailed stock data from CSV
    
    Returns:
        dict: Dictionary with stock symbol as key and details as value
    """
    try:
        csv_path = os.path.join(DATA_DIR, 'stock_details.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            # Convert JSON columns back from string
            for col in ['technical_indicators', 'fundamental_data', 'changes', 'news']:
                if col in df.columns:
                    df[col] = df[col].apply(lambda x: json.loads(x) if isinstance(x, str) else {})
            
            # Create dictionary with symbol as key
            stock_dict = {}
            for _, row in df.iterrows():
                try:
                    symbol = row['symbol']
                    stock_dict[symbol] = row.to_dict()
                except:
                    continue
                    
            logger.info(f"Loaded detailed data for {len(stock_dict)} stocks")
            return stock_dict
        else:
            logger.warning(f"Stock details CSV not found: {csv_path}")
            return {}
    except Exception as e:
        logger.error(f"Error loading stock details from CSV: {e}")
        return {}

def load_mutual_fund_details_from_csv():
    """
    Load detailed mutual fund data from CSV
    
    Returns:
        dict: Dictionary with scheme code as key and details as value
    """
    try:
        csv_path = os.path.join(DATA_DIR, 'mutual_fund_details.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            # Convert JSON columns back from string
            for col in ['returns', 'portfolio', 'historical_nav']:
                if col in df.columns:
                    df[col] = df[col].apply(lambda x: json.loads(x) if isinstance(x, str) else {})
            
            # Create dictionary with scheme_code as key
            mf_dict = {}
            for _, row in df.iterrows():
                try:
                    code = str(row['scheme_code'])
                    mf_dict[code] = row.to_dict()
                except:
                    continue
                    
            logger.info(f"Loaded detailed data for {len(mf_dict)} mutual funds")
            return mf_dict
        else:
            logger.warning(f"Mutual fund details CSV not found: {csv_path}")
            return {}
    except Exception as e:
        logger.error(f"Error loading mutual fund details from CSV: {e}")
        return {}

def get_stock_technical_data(symbol):
    """
    Get technical indicators for a specific stock
    
    Args:
        symbol (str): Stock symbol
        
    Returns:
        dict: Technical indicators for the stock
    """
    # First try to get from CSV file
    stock_details = load_stock_details_from_csv()
    if symbol in stock_details and 'technical_indicators' in stock_details[symbol]:
        logger.info(f"Loaded technical indicators for {symbol} from CSV")
        return stock_details[symbol]['technical_indicators']
        
    # If not available, calculate from price data
    from .data_collection import fetch_stock_price_data, calculate_technical_indicators
    logger.info(f"Calculating technical indicators for {symbol}")
    
    price_data = fetch_stock_price_data(symbol)
    if price_data is None or price_data.empty:
        logger.warning(f"No price data for {symbol}, cannot calculate technical indicators")
        return {}
        
    technical_data = calculate_technical_indicators(price_data)
    
    # Extract key indicators
    result = {}
    for indicator in ['RSI', 'MACD_12_26_9', 'MACDs_12_26_9', 'SMA20', 'SMA50', 'SMA200']:
        if indicator in technical_data.columns:
            result[indicator] = technical_data[indicator].iloc[-1]
            
    return result

def get_stock_fundamental_data(symbol):
    """
    Get fundamental data for a stock symbol
    
    Args:
        symbol (str): Stock symbol
        
    Returns:
        dict: Fundamental data
    """
    # Check if data is in cache
    cache_key = f"stock_fundamental_{symbol}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    
    # If not available, fetch from source
    from .data_collection import fetch_stock_fundamental_data
    logger.info(f"Fetching fundamental data for {symbol}")
    
    fundamental_data = fetch_stock_fundamental_data(symbol)
    if fundamental_data is None:
        logger.warning(f"No fundamental data available for {symbol}")
        return {}
        
    return fundamental_data

def get_mutual_fund_details(scheme_code):
    """
    Get detailed information for a mutual fund
    
    Args:
        scheme_code (str): Mutual fund scheme code
        
    Returns:
        dict: Detailed information for the mutual fund
    """
    # First try to get from CSV file
    mf_details = load_mutual_fund_details_from_csv()
    if scheme_code in mf_details:
        logger.info(f"Loaded detailed information for mutual fund {scheme_code} from CSV")
        return mf_details[scheme_code]
        
    # If not available, fetch from source
    from .data_collection import fetch_mutual_fund_details
    logger.info(f"Fetching detailed information for mutual fund {scheme_code}")
    
    details = fetch_mutual_fund_details(scheme_code)
    if details is None:
        logger.warning(f"No detailed information available for mutual fund {scheme_code}")
        return {}
        
    return details

def get_top_recommended_stocks(user_profile, limit=10):
    """
    Get top recommended stocks based on user profile
    
    Args:
        user_profile: User's financial profile model or dictionary
        limit (int): Maximum number of stocks to return
        
    Returns:
        list: List of recommended stocks
    """
    logger.info(f"Getting top {limit} recommended stocks for user profile")
    
    try:
        # Convert profile to dictionary if it's a django model
        profile_dict = {}
        
        # Handle both object with attributes and dictionary formats
        if hasattr(user_profile, '__dict__'):
            # It's an object, extract attributes
            profile_dict = {
                'risk_tolerance': getattr(user_profile, 'risk_tolerance', 'moderate'),
                'investment_time_horizon': getattr(user_profile, 'investment_time_horizon', '5 years'),
                'monthly_income': getattr(user_profile, 'monthly_income', 0),
                'monthly_expenses': getattr(user_profile, 'monthly_expenses', 0),
                'current_savings': getattr(user_profile, 'current_savings', 0),
                'existing_investments': getattr(user_profile, 'existing_investments', 0),
                'current_debt': getattr(user_profile, 'current_debt', 0)
            }
        else:
            # It's already a dictionary
            profile_dict = user_profile
            # Ensure key names match expected format
            if 'investment_time_horizon' in profile_dict and 'investment_horizon' not in profile_dict:
                profile_dict['investment_horizon'] = profile_dict['investment_time_horizon']
        
        # Use the recommendation_system to generate stock recommendations
        try:
            from .recommendation_system import generate_stock_recommendations
            
            # Get recommendations
            recommendations = generate_stock_recommendations(profile_dict)
            
            if recommendations and 'status' in recommendations and recommendations['status'] == 'success':
                logger.info(f"Successfully generated {len(recommendations.get('recommendations', []))} stock recommendations")
                
                # Format the recommendations to match expected structure
                formatted_recommendations = []
                for stock in recommendations.get('recommendations', [])[:limit]:
                    # Determine recommendation based on strength
                    strength = stock.get('recommendation_strength', 0)
                    if strength >= 8:
                        recommendation = 'Strong Buy'
                    elif strength >= 6:
                        recommendation = 'Buy'
                    elif strength >= 4:
                        recommendation = 'Hold'
                    elif strength >= 2:
                        recommendation = 'Watch'
                    else:
                        recommendation = 'Avoid'
                    
                    formatted_stock = {
                        'symbol': stock.get('symbol', ''),
                        'company_name': stock.get('name', stock.get('symbol', '')),
                        'current_price': stock.get('current_price', 0),
                        'price': stock.get('current_price', 0),  # Adding price for backward compatibility
                        'sector': stock.get('sector', 'Unknown'),
                        'score': stock.get('recommendation_strength', 0) * 10,  # Convert from 0-10 to 0-100
                        'recommendation': recommendation,
                        'reasons': [stock.get('reason', "Recommended based on your investment profile")],
                        'risk_level': 'High' if profile_dict.get('risk_tolerance', '').lower() == 'high' else 
                                     ('Moderate' if profile_dict.get('risk_tolerance', '').lower() == 'moderate' else 'Low'),
                        'technical_indicators': {},
                        'fundamental_data': {
                            'pe_ratio': stock.get('pe_ratio'),
                            'dividend_yield': stock.get('dividend_yield')
                        }
                    }
                    formatted_recommendations.append(formatted_stock)
                
                if formatted_recommendations:
                    return formatted_recommendations
            else:
                logger.warning(f"No recommendations generated or error in generate_stock_recommendations: {recommendations.get('message', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Error using recommendation_system: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
        
        # Fall back to default recommendations if the above fails
        logger.warning("Falling back to default stock recommendations")
        
        # Hard-coded guaranteed stocks for each risk profile
        default_stocks = {
            'conservative': [
                {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd.", "price": 2500, "sector": "Oil & Gas"},
                {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd.", "price": 3500, "sector": "IT"},
                {"symbol": "HDFCBANK", "company_name": "HDFC Bank Ltd.", "price": 1600, "sector": "Banking"},
                {"symbol": "HINDUNILVR", "company_name": "Hindustan Unilever Ltd.", "price": 2200, "sector": "FMCG"},
                {"symbol": "ICICIBANK", "company_name": "ICICI Bank Ltd.", "price": 900, "sector": "Banking"},
                {"symbol": "INFY", "company_name": "Infosys Ltd.", "price": 1500, "sector": "IT"},
                {"symbol": "KOTAKBANK", "company_name": "Kotak Mahindra Bank Ltd.", "price": 1800, "sector": "Banking"},
                {"symbol": "SBIN", "company_name": "State Bank of India", "price": 500, "sector": "Banking"}
            ],
            'moderate': [
                {"symbol": "BAJFINANCE", "company_name": "Bajaj Finance Ltd.", "price": 7200, "sector": "Financial Services"},
                {"symbol": "LT", "company_name": "Larsen & Toubro Ltd.", "price": 2800, "sector": "Engineering"},
                {"symbol": "MARUTI", "company_name": "Maruti Suzuki India Ltd.", "price": 9500, "sector": "Automobile"},
                {"symbol": "AXISBANK", "company_name": "Axis Bank Ltd.", "price": 800, "sector": "Banking"},
                {"symbol": "BHARTIARTL", "company_name": "Bharti Airtel Ltd.", "price": 800, "sector": "Telecom"},
                {"symbol": "ASIANPAINT", "company_name": "Asian Paints Ltd.", "price": 3300, "sector": "Consumer Goods"},
                {"symbol": "HCLTECH", "company_name": "HCL Technologies Ltd.", "price": 1200, "sector": "IT"},
                {"symbol": "TITAN", "company_name": "Titan Company Ltd.", "price": 2600, "sector": "Consumer Goods"}
            ],
            'aggressive': [
                {"symbol": "TATASTEEL", "company_name": "Tata Steel Ltd.", "price": 1300, "sector": "Metals"},
                {"symbol": "ADANIPORTS", "company_name": "Adani Ports and Special Economic Zone Ltd.", "price": 750, "sector": "Infrastructure"},
                {"symbol": "TECHM", "company_name": "Tech Mahindra Ltd.", "price": 1100, "sector": "IT"},
                {"symbol": "JSWSTEEL", "company_name": "JSW Steel Ltd.", "price": 700, "sector": "Metals"},
                {"symbol": "ITC", "company_name": "ITC Ltd.", "price": 450, "sector": "FMCG"},
                {"symbol": "M&M", "company_name": "Mahindra & Mahindra Ltd.", "price": 950, "sector": "Automobile"},
                {"symbol": "HINDALCO", "company_name": "Hindalco Industries Ltd.", "price": 480, "sector": "Metals"},
                {"symbol": "TATAMOTORS", "company_name": "Tata Motors Ltd.", "price": 600, "sector": "Automobile"}
            ]
        }
        
        # Get user's risk profile - default to moderate if not specified
        risk_tolerance = profile_dict.get('risk_tolerance', 'moderate').lower()
        
        # Return default recommendations
        return create_default_recommendations(risk_tolerance, default_stocks, limit)
            
    except Exception as e:
        logger.error(f"Error getting recommended stocks: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        # In case of catastrophic error, return minimal default recommendations
        risk_profile = getattr(user_profile, 'risk_tolerance', 'moderate').lower() if hasattr(user_profile, 'risk_tolerance') else 'moderate'
        default_stocks = {
            'conservative': [
                {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd.", "price": 2500, "sector": "Oil & Gas"},
                {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd.", "price": 3500, "sector": "IT"}
            ],
            'moderate': [
                {"symbol": "BAJFINANCE", "company_name": "Bajaj Finance Ltd.", "price": 7200, "sector": "Financial Services"},
                {"symbol": "LT", "company_name": "Larsen & Toubro Ltd.", "price": 2800, "sector": "Engineering"}
            ],
            'aggressive': [
                {"symbol": "TATASTEEL", "company_name": "Tata Steel Ltd.", "price": 1300, "sector": "Metals"},
                {"symbol": "ADANIPORTS", "company_name": "Adani Ports and Special Economic Zone Ltd.", "price": 750, "sector": "Infrastructure"}
            ]
        }
        return create_default_recommendations(risk_profile, default_stocks, limit)

def create_default_recommendations(risk_tolerance, default_stocks, limit=8):
    """Helper function to create default stock recommendations based on risk profile"""
    fallback_list = default_stocks.get(risk_tolerance, default_stocks['moderate'])
    result = []
    
    # Format default stocks with necessary fields
    for i, stock in enumerate(fallback_list[:limit]):
        score = 75 - (i * 3)  # Decreasing scores
        risk_level = 'Low' if risk_tolerance == 'conservative' else ('Moderate' if risk_tolerance == 'moderate' else 'High')
        reason = f"Selected based on {risk_tolerance} risk profile"
        
        result.append({
            'symbol': stock["symbol"],
            'company_name': stock["company_name"],
            'price': stock["price"],
            'sector': stock["sector"],
            'score': score,
            'reasons': [reason, "Recommended for your investment strategy"],
            'risk_level': risk_level,
            'technical_indicators': {},
            'fundamental_data': {}
        })
    
    logger.info(f"Created {len(result)} default recommendations for {risk_tolerance} risk profile")
    return result

def get_top_recommended_mutual_funds(user_profile, limit=10):
    """
    Get top recommended mutual funds based on user profile
    
    Args:
        user_profile: User's financial profile
        limit (int): Maximum number of mutual funds to return
        
    Returns:
        list: List of recommended mutual funds
    """
    try:
        # Convert profile to dictionary if it's a django model
        profile_dict = {}
        
        # Handle both object with attributes and dictionary formats
        if hasattr(user_profile, '__dict__'):
            # It's an object, extract attributes
            profile_dict = {
                'risk_tolerance': getattr(user_profile, 'risk_tolerance', 'moderate'),
                'investment_time_horizon': getattr(user_profile, 'investment_time_horizon', '5 years'),
                'monthly_income': getattr(user_profile, 'monthly_income', 0),
                'monthly_expenses': getattr(user_profile, 'monthly_expenses', 0),
                'current_savings': getattr(user_profile, 'current_savings', 0),
                'existing_investments': getattr(user_profile, 'existing_investments', 0),
                'current_debt': getattr(user_profile, 'current_debt', 0)
            }
        else:
            # It's already a dictionary
            profile_dict = user_profile
        
        # Use the recommendation_system to generate mutual fund recommendations
        try:
            from .recommendation_system import generate_mutual_fund_recommendations
            
            # Get recommendations
            recommendations = generate_mutual_fund_recommendations(profile_dict)
            
            if recommendations and 'status' in recommendations and recommendations['status'] == 'success':
                logger.info(f"Successfully generated {len(recommendations.get('recommendations', []))} mutual fund recommendations")
                
                # Format the recommendations to match expected structure
                formatted_recommendations = []
                for fund in recommendations.get('recommendations', [])[:limit]:
                    formatted_fund = {
                        'name': fund.get('name', ''),
                        'code': fund.get('scheme_code', ''),
                        'category': fund.get('category', 'Diversified'),
                        'nav': fund.get('nav', 0),
                        'expense_ratio': fund.get('expense_ratio', 1.5),
                        'risk_level': fund.get('risk_level', 'Moderate'),
                        'returns': {
                            '1y': fund.get('one_year_return', 8),
                            '3y': fund.get('three_year_return', 12),
                            '5y': fund.get('five_year_return', 15)
                        },
                        'recommendation': 'Buy',
                        'risk_management': [fund.get('reason', 'Aligned with your investment goals')]
                    }
                    formatted_recommendations.append(formatted_fund)
                
                if formatted_recommendations:
                    return formatted_recommendations
            else:
                logger.warning(f"No recommendations generated or error in generate_mutual_fund_recommendations: {recommendations.get('message', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Error using recommendation_system for mutual funds: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
        
        # If recommendation system fails, use default implementation
        logger.info("Using default mutual fund recommendation logic")
        # Load all mutual funds
        funds = get_mutual_fund_list()
        if not funds:
            logger.error("No mutual funds available")
            return []
            
        # Load detailed mutual fund data
        mf_details = load_mutual_fund_details_from_csv()
        
        # Get user's risk preference and investment horizon
        risk_tolerance = user_profile.risk_tolerance.lower() if hasattr(user_profile, 'risk_tolerance') else 'moderate'
        horizon = user_profile.investment_time_horizon.lower() if hasattr(user_profile, 'investment_time_horizon') else 'medium'
        
        # Score and rank mutual funds based on user profile
        scored_funds = []
        for fund in funds:
            score = 0
            scheme_code = fund.get('code', fund.get('scheme_code', ''))
            detail = mf_details.get(scheme_code, {}) if mf_details else {}
            
            # Combine fund data with details
            fund_data = {**fund, **detail}
            
            # Category scoring based on risk tolerance
            category = fund_data.get('category', '').lower()
            if risk_tolerance == 'conservative':
                if any(term in category for term in ['large cap', 'debt', 'liquid', 'gilt']):
                    score += 15
                elif any(term in category for term in ['balanced', 'hybrid']):
                    score += 8
                elif any(term in category for term in ['mid cap']):
                    score -= 5
                elif any(term in category for term in ['small cap', 'sectoral']):
                    score -= 10
            elif risk_tolerance == 'moderate':
                if any(term in category for term in ['multi cap', 'flexi cap', 'balanced']):
                    score += 15
                elif any(term in category for term in ['mid cap', 'large & mid']):
                    score += 8
                elif any(term in category for term in ['large cap']):
                    score += 5
                elif any(term in category for term in ['small cap']):
                    score += 2
            elif risk_tolerance == 'high' or risk_tolerance == 'aggressive':
                if any(term in category for term in ['small cap', 'sectoral']):
                    score += 15
                elif any(term in category for term in ['mid cap']):
                    score += 10
                elif any(term in category for term in ['multi cap']):
                    score += 5
                elif any(term in category for term in ['large cap']):
                    score += 2
                    
            # Add fund with its score
            scored_funds.append({
                'fund': fund_data,
                'score': score
            })
            
        # Sort by score descending
        scored_funds = sorted(scored_funds, key=lambda x: x['score'], reverse=True)
        
        # Take top funds
        top_funds = scored_funds[:limit]
        
        # Format results
        results = []
        for item in top_funds:
            fund = item['fund']
            results.append({
                'name': fund.get('name', fund.get('scheme_name', '')),
                'code': fund.get('code', fund.get('scheme_code', '')),
                'category': fund.get('category', 'Diversified'),
                'nav': fund.get('nav', 0),
                'expense_ratio': fund.get('expense_ratio', 1.5),
                'risk_level': fund.get('risk_level', 'Moderate'),
                'returns': {
                    '1y': fund.get('one_year_return', 8),
                    '3y': fund.get('three_year_return', 12),
                    '5y': fund.get('five_year_return', 15)
                },
                'recommendation': 'Buy',
                'risk_management': [
                    f"Selected based on your {risk_tolerance} risk profile",
                    f"Aligned with your {horizon} investment horizon"
                ]
            })
        
        return results
        
    except Exception as e:
        logger.error(f"Error getting recommended mutual funds: {e}")
        
        # Return default mutual funds in case of error
        return get_default_mutual_funds(user_profile)[:limit] 