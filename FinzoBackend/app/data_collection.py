#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Data Collection Module for Indian Investment Recommendation System.
This module handles fetching data from various sources:
- Stock list from NSE
- Technical and fundamental data from yfinance, screener.in, etc.
- Mutual fund data
- Commodity data
- SIP data
"""

import os
import time
import logging
import pandas as pd
import numpy as np
import requests
import yfinance as yf
from io import StringIO
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import random
import json
import backoff  # Add this import for exponential backoff
import pickle   # For data caching

# Set up logging
logger = logging.getLogger(__name__)

# Constants
NSE_STOCK_LIST_URL = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
SCREENER_BASE_URL = "https://www.screener.in/company/"
MUTUAL_FUND_URL = "https://www.amfiindia.com/spages/NAVAll.txt"
COMMODITIES_URL = "https://economictimes.indiatimes.com/commoditysummary/commodityid-"

# Cache directory for stored data
CACHE_DIR = "data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Create a list of different user agents to rotate
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.48",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
]

# Headers for web scraping
def get_random_headers():
    """Get a random user agent and create headers for requests"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

# Original headers for backward compatibility
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# Cache utility functions
def get_cache_path(data_type):
    """Get the path for the cache file for a specific data type with today's date"""
    today = datetime.now().strftime("%Y%m%d")
    return os.path.join(CACHE_DIR, f"{data_type}_{today}.pkl")

def is_cache_valid(data_type):
    """Check if cache for the given data type exists and is from today"""
    cache_path = get_cache_path(data_type)
    if os.path.exists(cache_path):
        logger.info(f"Cache file found for {data_type}")
        return True
    logger.info(f"No valid cache file found for {data_type}")
    return False

def save_to_cache(data, data_type):
    """Save data to cache file"""
    cache_path = get_cache_path(data_type)
    try:
        with open(cache_path, 'wb') as f:
            pickle.dump(data, f)
        logger.info(f"Data saved to cache: {cache_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving cache for {data_type}: {e}")
        return False

def load_from_cache(data_type):
    """Load data from cache file"""
    cache_path = get_cache_path(data_type)
    try:
        with open(cache_path, 'rb') as f:
            data = pickle.load(f)
        logger.info(f"Data loaded from cache: {cache_path}")
        return data
    except Exception as e:
        logger.error(f"Error loading cache for {data_type}: {e}")
        return None

def make_request_with_retry(url, headers=None, timeout=(10, 30), max_retries=5, initial_delay=2, use_proxy=False):
    """
    Make an HTTP request with retry logic.
    
    Args:
        url (str): The URL to request
        headers (dict): Headers to include in the request
        timeout (tuple): Connection and read timeout in seconds
        max_retries (int): Maximum number of retry attempts
        initial_delay (int): Initial delay before first retry in seconds
        use_proxy (bool): Whether to use a proxy
        
    Returns:
        tuple: (response object or None, error message or None)
    """
    if headers is None:
        headers = get_random_headers()
    
    # Create a new session for each request to avoid connection pooling issues
    session = requests.Session()
    
    # Set a longer connect timeout to handle slow connections
    session.mount('https://', requests.adapters.HTTPAdapter(
        max_retries=requests.adapters.Retry(
            total=max_retries,
            backoff_factor=initial_delay,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "HEAD", "OPTIONS"]
        )
    ))
    
    proxies = None
    # Disable proxy usage by default - it's causing more problems than it solves
    use_proxy = False
    
    if use_proxy:
        # In a production environment, you should use a reliable proxy service
        # For now, we'll disable proxy usage since it's causing timeouts
        logger.info("Proxy usage is currently disabled to prevent timeouts")
    
    for retry in range(max_retries):
        try:
            # Use a new random user agent for each retry
            if retry > 0:
                headers = get_random_headers()
            
            # Make the request with explicit timeout and possible proxy
            response = session.get(
                url, 
                headers=headers, 
                timeout=timeout,
                proxies=proxies
            )
            
            if response.status_code == 200:
                return response, None
            elif response.status_code == 429:  # Too Many Requests
                # If rate limited, wait longer before retry
                wait_time = initial_delay * (2 ** retry) + random.uniform(0, 2)
                logger.warning(f"Rate limited for {url}, retrying in {wait_time:.2f}s (attempt {retry+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                # Other HTTP error
                error_msg = f"HTTP error {response.status_code} for {url}"
                logger.warning(error_msg)
                
                # For screener.in, we'll try again with exponential backoff for all error codes
                if "screener.in" in url:
                    wait_time = initial_delay * (2 ** retry) + random.uniform(0, 2)
                    logger.warning(f"Retrying {url} in {wait_time:.2f}s (attempt {retry+1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    return None, error_msg
                
        except requests.exceptions.Timeout:
            # Handle timeout specifically
            wait_time = initial_delay * (2 ** retry) + random.uniform(0, 2)
            logger.warning(f"Timeout for {url}, retrying in {wait_time:.2f}s (attempt {retry+1}/{max_retries})")
            time.sleep(wait_time)
            
        except requests.exceptions.RequestException as e:
            # Handle other request exceptions
            wait_time = initial_delay * (2 ** retry) + random.uniform(0, 2)
            logger.warning(f"Request error for {url}: {e}, retrying in {wait_time:.2f}s (attempt {retry+1}/{max_retries})")
            time.sleep(wait_time)
            
            if retry == max_retries - 1:  # Last retry
                return None, str(e)
    
    return None, "Max retries exceeded"

def fetch_stock_list():
    """
    Fetch list of stocks from NSE.
    
    Returns:
        list: List of dictionaries containing stock symbols and names
    """
    # Check if we have valid cached data
    if is_cache_valid("stock_list"):
        cached_data = load_from_cache("stock_list")
        if cached_data:
            logger.info(f"Using cached stock list with {len(cached_data)} stocks")
            return cached_data
    
    logger.info("Fetching stock list from NSE")
    try:
        # Use the retry utility function
        response, error = make_request_with_retry(NSE_STOCK_LIST_URL)
        
        if response is not None:
            # Parse CSV data
            csv_data = StringIO(response.text)
            df = pd.read_csv(csv_data)
            
            # Select only required columns
            df = df[["SYMBOL", "NAME OF COMPANY"]]
            df.columns = ["symbol", "name"]
            
            # Convert to list of dictionaries
            stocks = df.to_dict("records")
            logger.info(f"Successfully fetched {len(stocks)} stocks")
            
            # Save to cache
            save_to_cache(stocks, "stock_list")
            
            return stocks
        else:
            logger.error(f"Failed to fetch stock list: {error}")
            # Return a small sample of stocks in case of failure
            return [
                {"symbol": "RELIANCE", "name": "Reliance Industries Limited"},
                {"symbol": "TCS", "name": "Tata Consultancy Services Limited"},
                {"symbol": "HDFCBANK", "name": "HDFC Bank Limited"},
                {"symbol": "INFY", "name": "Infosys Limited"},
                {"symbol": "ICICIBANK", "name": "ICICI Bank Limited"}
            ]
    except Exception as e:
        logger.error(f"Error fetching stock list: {e}")
        # Return a small sample of stocks in case of failure
        return [
            {"symbol": "RELIANCE", "name": "Reliance Industries Limited"},
            {"symbol": "TCS", "name": "Tata Consultancy Services Limited"},
            {"symbol": "HDFCBANK", "name": "HDFC Bank Limited"},
            {"symbol": "INFY", "name": "Infosys Limited"},
            {"symbol": "ICICIBANK", "name": "ICICI Bank Limited"}
        ]

def fetch_technical_data(stocks_list):
    """
    Fetch technical data for the given list of stocks using yfinance.
    
    Args:
        stocks_list (list): List of stock dictionaries with symbols
        
    Returns:
        dict: Dictionary mapping stock symbols to technical data
    """
    # Check if we have valid cached data
    if is_cache_valid("technical_data"):
        cached_data = load_from_cache("technical_data")
        if cached_data:
            logger.info(f"Using cached technical data for {len(cached_data)} stocks")
            return cached_data
    
    logger.info(f"Fetching technical data for {len(stocks_list)} stocks")
    technical_data = {}
    
    for i, stock in enumerate(stocks_list):
        symbol = stock["symbol"]
        nse_symbol = f"{symbol}.NS"  # NSE suffix for yfinance
        
        try:
            # Fetch data with retries
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # Get stock data
                    stock_data = yf.Ticker(nse_symbol)
                    hist = stock_data.history(period="1y")
                    
                    if hist.empty:
                        logger.warning(f"No data found for {symbol}, trying alternative symbol")
                        # Try without .NS suffix
                        stock_data = yf.Ticker(symbol)
                        hist = stock_data.history(period="1y")
                    
                    if not hist.empty:
                        break
                    
                    time.sleep(1)  # Add delay to prevent rate limiting
                except Exception as e:
                    logger.warning(f"Attempt {attempt+1} failed for {symbol}: {e}")
                    time.sleep(2)
            
            # If still empty after retries, skip this stock
            if hist.empty:
                logger.warning(f"Skipping {symbol} due to no data")
                continue
            
            # Calculate technical indicators
            # Moving averages
            hist['MA50'] = hist['Close'].rolling(window=50).mean()
            hist['MA200'] = hist['Close'].rolling(window=200).mean()
            
            # Calculate MACD
            hist['EMA12'] = hist['Close'].ewm(span=12, adjust=False).mean()
            hist['EMA26'] = hist['Close'].ewm(span=26, adjust=False).mean()
            hist['MACD'] = hist['EMA12'] - hist['EMA26']
            hist['MACD_Signal'] = hist['MACD'].ewm(span=9, adjust=False).mean()
            hist['MACD_Histogram'] = hist['MACD'] - hist['MACD_Signal']
            
            # Calculate volume change (relative to 20-day average)
            hist['Volume_MA20'] = hist['Volume'].rolling(window=20).mean()
            hist['Volume_Change'] = hist['Volume'] / hist['Volume_MA20']
            
            # Get most recent data
            latest = hist.iloc[-1] if not hist.empty else None
            
            if latest is not None:
                # Calculate various technical indicators
                current_price = latest['Close']
                ma50 = latest['MA50']
                ma200 = latest['MA200']
                
                # Calculate RSI
                delta = hist['Close'].diff()
                gain = delta.where(delta > 0, 0).rolling(window=14).mean()
                loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs.iloc[-1])) if loss.iloc[-1] != 0 else 50
                
                # Store technical data
                technical_data[symbol] = {
                    "current_price": current_price,
                    "day_change": hist['Close'].pct_change().iloc[-1] * 100,
                    "volume": latest['Volume'],
                    "ma50": ma50,
                    "ma200": ma200,
                    "price_to_ma50": current_price / ma50 if pd.notna(ma50) and ma50 > 0 else None,
                    "price_to_ma200": current_price / ma200 if pd.notna(ma200) and ma200 > 0 else None,
                    "rsi": rsi,
                    "volatility": hist['Close'].pct_change().std() * 100,
                    "macd": latest['MACD'],
                    "macd_signal": latest['MACD_Signal'],
                    "macd_histogram": latest['MACD_Histogram'],
                    "volume_change": latest['Volume_Change'] if pd.notna(latest['Volume_Change']) else 1.0,
                }
                
                # Progress indicator for long-running process
                if (i + 1) % 5 == 0 or i == len(stocks_list) - 1:
                    logger.info(f"Fetched technical data for {i + 1}/{len(stocks_list)} stocks")
            
        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}")
    
    # Save the data to cache after all stocks are processed
    save_to_cache(technical_data, "technical_data")
    
    return technical_data

def fetch_fundamental_data(stocks_list):
    """
    Fetch fundamental data for the given list of stocks.
    
    Args:
        stocks_list (list): List of stock dictionaries with symbols
        
    Returns:
        dict: Dictionary mapping stock symbols to fundamental data
    """
    # Check if we have valid cached data
    if is_cache_valid("fundamental_data"):
        cached_data = load_from_cache("fundamental_data")
        if cached_data:
            logger.info(f"Using cached fundamental data for {len(cached_data)} stocks")
            return cached_data
    
    logger.info(f"Fetching fundamental data for {len(stocks_list)} stocks")
    fundamental_data = {}
    
    # Create a dictionary of common sectors for reference
    common_sectors = {
        "automobile": "Automobile",
        "auto": "Automobile",
        "bank": "Banking",
        "finance": "Financial Services",
        "nbfc": "Financial Services",
        "insurance": "Insurance",
        "oil": "Oil & Gas",
        "gas": "Oil & Gas",
        "petroleum": "Oil & Gas",
        "pharma": "Pharmaceuticals",
        "drug": "Pharmaceuticals",
        "medicine": "Pharmaceuticals",
        "health": "Healthcare",
        "tech": "Technology",
        "software": "Information Technology",
        "it service": "Information Technology",
        "computer": "Information Technology",
        "info": "Information Technology",
        "mining": "Mining",
        "metal": "Metals",
        "steel": "Metals",
        "consumption": "Consumer Goods",
        "consumer": "Consumer Goods",
        "retail": "Retail",
        "fmcg": "FMCG",
        "cement": "Cement",
        "construction": "Construction",
        "real estate": "Real Estate",
        "property": "Real Estate",
        "power": "Power",
        "energy": "Energy",
        "electric": "Power",
        "renewabl": "Renewable Energy",
        "solar": "Renewable Energy",
        "telecom": "Telecommunications",
        "media": "Media & Entertainment",
        "entertainment": "Media & Entertainment"
    }
    
    for i, stock in enumerate(stocks_list):
        symbol = stock["symbol"]
        name = stock["name"]
        
        try:
            # First try to get data from screener.in
            time.sleep(random.uniform(1, 2))  # Respectful delay
            
            screener_url = f"{SCREENER_BASE_URL}{symbol}/"
            response, error = make_request_with_retry(screener_url)
            
            # Process response
            if response is not None:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract sector
                sector_elem = soup.select_one('a[href^="/screen/sector/"]')
                sector = sector_elem.text.strip() if sector_elem else None
                
                # If sector is not found, try to extract from company name or use yfinance
                if not sector or sector == "Unknown":
                    # Try to extract sector from company name based on common industry keywords
                    company_name_lower = name.lower()
                    for keyword, sector_name in common_sectors.items():
                        if keyword in company_name_lower:
                            sector = sector_name
                            break
                
                # Extract various ratios
                ratios = {}
                ratio_elements = soup.select('li.flex')
                for elem in ratio_elements:
                    label_elem = elem.select_one('span.name')
                    value_elem = elem.select_one('span.number')
                    
                    if label_elem and value_elem:
                        label = label_elem.text.strip()
                        value_text = value_elem.text.strip()
                        
                        # Convert text to numerical value where appropriate
                        try:
                            # Handle percentage format
                            if '%' in value_text:
                                value = float(value_text.replace('%', '').replace(',', '').strip())
                            # Handle crore format
                            elif 'Cr.' in value_text:
                                value = float(value_text.replace('Cr.', '').replace(',', '').strip()) * 10000000
                            # Handle raw numbers
                            else:
                                value = float(value_text.replace(',', '').strip())
                        except ValueError:
                            value = value_text
                        
                        ratios[label] = value
                
                # Extract financial data
                financial_data = {}
                tables = soup.select('table.data-table')
                
                for table in tables:
                    header = table.select_one('th')
                    if header and 'Quarterly Results' in header.text:
                        rows = table.select('tr')
                        for row in rows[1:]:  # Skip header row
                            cells = row.select('td')
                            if len(cells) > 1:
                                try:
                                    quarter = cells[0].text.strip()
                                    sales = cells[1].text.strip()
                                    expenses = cells[2].text.strip() if len(cells) > 2 else None
                                    profit = cells[3].text.strip() if len(cells) > 3 else None
                                    
                                    financial_data[quarter] = {
                                        'sales': sales,
                                        'expenses': expenses,
                                        'profit': profit
                                    }
                                except Exception as e:
                                    logger.warning(f"Error parsing quarterly result row for {symbol}: {e}")
                
                # Industry PE ratio - check for industry PE comparison if available
                industry_pe = None
                industry_pe_elements = soup.select('p.text-right')
                for elem in industry_pe_elements:
                    if 'Industry P/E' in elem.text:
                        try:
                            industry_pe_text = elem.text.replace('Industry P/E:', '').strip()
                            industry_pe = float(industry_pe_text)
                        except ValueError:
                            pass
                
                # Calculate profit growth if we have at least 2 quarters of data
                profit_growth = None
                if len(financial_data) >= 2:
                    try:
                        # Get profits from last 2 quarters
                        profits = []
                        for quarter, data in list(financial_data.items())[:2]:
                            profit_text = data['profit'].replace(',', '').replace('Cr.', '')
                            profits.append(float(profit_text))
                        
                        if len(profits) == 2 and profits[1] != 0:
                            # Calculate QoQ growth
                            profit_growth = ((profits[0] - profits[1]) / abs(profits[1])) * 100
                    except (ValueError, KeyError, IndexError):
                        pass
                
                # Store fundamental data
                fundamental_data[symbol] = {
                    "name": name,
                    "sector": sector or "Unknown",
                    "market_cap": ratios.get("Market Cap", None),
                    "pe_ratio": ratios.get("P/E", None),
                    "industry_pe": industry_pe,
                    "eps": ratios.get("EPS", None),
                    "book_value": ratios.get("Book Value", None),
                    "debt_to_equity": ratios.get("Debt / Equity", None),
                    "roe": ratios.get("ROE", None),
                    "roce": ratios.get("ROCE", None),
                    "dividend_yield": ratios.get("Div Yield", None),
                    "profit_growth": profit_growth,
                    "quarterly_results": financial_data,
                }
                
            else:
                # If screener.in fails, try to get basic data from yfinance
                stock_data = yf.Ticker(f"{symbol}.NS")
                info = stock_data.info
                
                # Try to determine sector from company name if yfinance doesn't provide it
                sector = info.get("sector", None)
                if not sector or sector == "Unknown":
                    company_name_lower = name.lower()
                    for keyword, sector_name in common_sectors.items():
                        if keyword in company_name_lower:
                            sector = sector_name
                            break
                
                fundamental_data[symbol] = {
                    "name": name,
                    "sector": sector or "Unknown",
                    "market_cap": info.get("marketCap", None),
                    "pe_ratio": info.get("trailingPE", None),
                    "eps": info.get("trailingEps", None),
                    "book_value": info.get("bookValue", None),
                    "debt_to_equity": info.get("debtToEquity", None),
                    "roe": info.get("returnOnEquity", None) * 100 if info.get("returnOnEquity") is not None else None,
                    "dividend_yield": info.get("dividendYield", None) * 100 if info.get("dividendYield") is not None else None,
                    "quarterly_results": {},
                }
            
            # Progress indicator
            if (i + 1) % 5 == 0 or i == len(stocks_list) - 1:
                logger.info(f"Fetched fundamental data for {i + 1}/{len(stocks_list)} stocks")
                
        except Exception as e:
            logger.error(f"Error fetching fundamental data for {symbol}: {e}")
            
            # Add basic info even if there's an error
            fundamental_data[symbol] = {
                "name": name,
                "sector": "Unknown",
                "market_cap": None,
                "pe_ratio": None,
                "eps": None,
                "debt_to_equity": None,
                "roe": None,
                "quarterly_results": {},
            }
    
    # Save to cache
    save_to_cache(fundamental_data, "fundamental_data")
    
    return fundamental_data

def fetch_mutual_fund_data():
    """
    Fetch mutual fund data from AMFI.
    
    Returns:
        dict: Dictionary of mutual fund data
    """
    # Check if we have valid cached data
    if is_cache_valid("mutual_fund_data"):
        cached_data = load_from_cache("mutual_fund_data")
        if cached_data:
            logger.info(f"Using cached mutual fund data with {len(cached_data)} funds")
            return cached_data
    
    logger.info("Fetching mutual fund data from AMFI")
    
    try:
        # Make request to AMFI
        response, error = make_request_with_retry(MUTUAL_FUND_URL)
        
        if response is not None:
            mutual_funds = {}
            lines = response.text.strip().split('\n')
            
            current_scheme = None
            for line in lines:
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Check if it's a scheme name line
                if not line[0].isdigit() and ';' not in line:
                    current_scheme = line
                    continue
                
                # Parse data line
                parts = line.split(';')
                if len(parts) >= 5:
                    try:
                        scheme_code = parts[0].strip()
                        scheme_name = parts[3].strip()
                        nav = float(parts[4].strip())
                        
                        # Determine category based on scheme name
                        category = "Unknown"
                        if "EQUITY" in scheme_name:
                            category = "Equity"
                        elif "DEBT" in scheme_name or "BOND" in scheme_name:
                            category = "Debt"
                        elif "HYBRID" in scheme_name or "BALANCED" in scheme_name:
                            category = "Hybrid"
                        elif "LIQUID" in scheme_name:
                            category = "Liquid"
                        elif "INDEX" in scheme_name:
                            category = "Index"
                        elif "GILT" in scheme_name:
                            category = "Gilt"
                        
                        # Determine risk level based on category
                        risk_level = "Medium"
                        if category == "Equity":
                            risk_level = "High"
                        elif category in ["Debt", "Liquid", "Gilt"]:
                            risk_level = "Low"
                        
                        # Store mutual fund data
                        mutual_funds[scheme_code] = {
                            "name": scheme_name,
                            "nav": nav,
                            "category": category,
                            "risk_level": risk_level,
                            "amc": current_scheme if current_scheme else "Unknown",
                        }
                    except Exception as e:
                        logger.warning(f"Error parsing mutual fund line: {e}")
                
            logger.info(f"Successfully fetched {len(mutual_funds)} mutual funds")
            
            # Save to cache
            save_to_cache(mutual_funds, "mutual_fund_data")
            
            return mutual_funds
        else:
            logger.error(f"Failed to fetch mutual fund data: {error}")
            return get_sample_mutual_funds()
    except Exception as e:
        logger.error(f"Error fetching mutual fund data: {e}")
        return get_sample_mutual_funds()

def get_sample_mutual_funds():
    """
    Get sample mutual fund data when actual data fetch fails.
    
    Returns:
        dict: Dictionary of sample mutual fund data
    """
    return {
        "119551": {
            "scheme_code": "119551",
            "name": "Axis Bluechip Fund - Direct Plan - Growth",
            "category": "Equity",
            "scheme_type": "Open Ended Schemes",
            "nav": 45.21,
            "aum_crores": 2500.75,
            "expense_ratio": 0.45,
            "one_year_return": 12.5,
            "three_year_return": 10.2,
            "five_year_return": 9.5,
            "risk_rating": 8
        },
        "119775": {
            "scheme_code": "119775",
            "name": "HDFC Corporate Bond Fund - Direct Plan - Growth",
            "category": "Debt",
            "scheme_type": "Open Ended Schemes",
            "nav": 28.36,
            "aum_crores": 3200.50,
            "expense_ratio": 0.35,
            "one_year_return": 7.2,
            "three_year_return": 8.1,
            "five_year_return": 7.8,
            "risk_rating": 4
        }
    }

def fetch_commodity_data():
    """
    Fetch commodity data.
    
    Returns:
        dict: Dictionary of commodity data
    """
    # Check if we have valid cached data
    if is_cache_valid("commodity_data"):
        cached_data = load_from_cache("commodity_data")
        if cached_data:
            logger.info(f"Using cached commodity data with {len(cached_data)} commodities")
            return cached_data
    
    logger.info("Fetching commodity data")
    
    # List of commodity IDs
    commodity_ids = {
        "1": "Gold",
        "2": "Silver",
        "3": "Crude Oil",
        "4": "Natural Gas",
        "5": "Copper",
        "13": "Aluminium"
    }
    
    commodities = {}
    
    for commodity_id, commodity_name in commodity_ids.items():
        url = f"{COMMODITIES_URL}{commodity_id}.cms"
        
        try:
            response, error = make_request_with_retry(url)
            
            if response is not None:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract current price
                price_elem = soup.select_one('.commodityPrice')
                current_price = None
                if price_elem:
                    price_text = price_elem.text.strip()
                    try:
                        # Remove currency symbols and commas, then convert to float
                        current_price = float(price_text.replace('₹', '').replace(',', '').strip())
                    except ValueError:
                        logger.warning(f"Could not parse price for {commodity_name}: {price_text}")
                
                # Extract day change
                change_elem = soup.select_one('.commodityChange')
                day_change = None
                if change_elem:
                    change_text = change_elem.text.strip()
                    try:
                        # Extract numeric part from text like "+1.23%"
                        day_change = float(change_text.replace('%', '').strip())
                    except ValueError:
                        logger.warning(f"Could not parse day change for {commodity_name}: {change_text}")
                
                # Store commodity data
                commodities[commodity_name] = {
                    "current_price": current_price,
                    "day_change": day_change,
                    "unit": "per 10 grams" if commodity_name in ["Gold", "Silver"] else "per barrel" if commodity_name == "Crude Oil" else "per mmBtu" if commodity_name == "Natural Gas" else "per kg"
                }
                
                logger.info(f"Fetched data for {commodity_name}")
                time.sleep(1)  # Respectful delay
                
            else:
                logger.warning(f"Failed to fetch data for {commodity_name}: {error}")
                
        except Exception as e:
            logger.error(f"Error fetching data for {commodity_name}: {e}")
    
    # If no commodity data could be fetched
    if not commodities:
        logger.warning("Using sample commodity data")
        commodities = {
            "Gold": {"current_price": 58750.0, "day_change": 0.12, "unit": "per 10 grams"},
            "Silver": {"current_price": 72500.0, "day_change": 0.28, "unit": "per kg"},
            "Crude Oil": {"current_price": 6090.0, "day_change": -0.52, "unit": "per barrel"},
            "Natural Gas": {"current_price": 245.0, "day_change": 0.75, "unit": "per mmBtu"},
            "Copper": {"current_price": 776.0, "day_change": 0.14, "unit": "per kg"}
        }
    
    # Save to cache
    save_to_cache(commodities, "commodity_data")
    
    return commodities

def fetch_sip_data():
    """
    Fetch SIP (Systematic Investment Plan) data.
    
    Returns:
        dict: Dictionary of SIP data
    """
    # Check if we have valid cached data
    if is_cache_valid("sip_data"):
        cached_data = load_from_cache("sip_data")
        if cached_data:
            logger.info(f"Using cached SIP data with {len(cached_data)} plans")
            return cached_data
    
    logger.info("Fetching SIP data")
    
    # Since there's no centralized API for SIP data, we'll use sample data
    # In a real implementation, you would scrape from mutual fund websites or use an API
    
    sip_data = {
        "Equity SIP": {
            "name": "Equity SIP",
            "type": "Equity",
            "min_investment": 1000,
            "expected_returns": 12.0,
            "risk_level": "High",
            "recommended_duration": 5,
            "description": "SIP in top-performing equity funds for long-term growth",
            "suitable_for": "Aggressive investors looking for long-term wealth creation"
        },
        "Debt SIP": {
            "name": "Debt SIP",
            "type": "Debt",
            "min_investment": 1000,
            "expected_returns": 7.0,
            "risk_level": "Low",
            "recommended_duration": 3,
            "description": "SIP in debt funds for stable returns with lower risk",
            "suitable_for": "Conservative investors looking for stable income"
        },
        "Balanced SIP": {
            "name": "Balanced SIP",
            "type": "Hybrid",
            "min_investment": 1000,
            "expected_returns": 9.0,
            "risk_level": "Medium",
            "recommended_duration": 4,
            "description": "SIP in hybrid funds for balanced growth and stability",
            "suitable_for": "Moderate investors looking for balanced returns"
        },
        "ELSS SIP": {
            "name": "ELSS SIP",
            "type": "Equity (Tax-Saving)",
            "min_investment": 500,
            "expected_returns": 12.0,
            "risk_level": "High",
            "recommended_duration": 3,
            "description": "SIP in ELSS funds for tax benefits under Section 80C",
            "suitable_for": "Investors looking for tax savings with equity returns"
        },
        "Liquid SIP": {
            "name": "Liquid SIP",
            "type": "Liquid",
            "min_investment": 500,
            "expected_returns": 5.0,
            "risk_level": "Very Low",
            "recommended_duration": 1,
            "description": "SIP in liquid funds for short-term parking of funds",
            "suitable_for": "Investors looking for alternatives to savings accounts"
        }
    }
    
    # Save to cache
    save_to_cache(sip_data, "sip_data")
    
    return sip_data

def get_data_from_moneycontrol(symbol, company_name):
    """
    Attempt to get data from MoneyControl as a fallback when screener.in fails.
    
    Args:
        symbol (str): Stock symbol
        company_name (str): Company name to search for
    
    Returns:
        dict: Dictionary of fundamental data or None if failed
    """
    try:
        # MoneyControl uses different URLs, we'll need to search for the company first
        search_term = company_name.replace(" ", "+")
        search_url = f"https://www.moneycontrol.com/stocks/cptmarket/compsearchnew.php?search_data={search_term}&cid=&mbsearch_str=&topsearch_type=1&search_str={search_term}"
        
        response, error = make_request_with_retry(search_url, timeout=(10, 30))
        
        if response is None:
            logger.warning(f"Failed to search MoneyControl for {company_name}: {error}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the first search result link
        search_results = soup.select('table.srch_tbl a')
        
        if not search_results:
            logger.warning(f"No search results found on MoneyControl for {company_name}")
            return None
        
        # Get the first result URL
        company_url = search_results[0]['href']
        
        # Make sure it's a full URL
        if not company_url.startswith('http'):
            company_url = f"https://www.moneycontrol.com{company_url}"
        
        # Get the company page
        response, error = make_request_with_retry(company_url, timeout=(10, 30))
        
        if response is None:
            logger.warning(f"Failed to get company page on MoneyControl for {company_name}: {error}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract data from the page
        data = {}
        
        # Try to get sector
        sector_div = soup.select_one('div.comp_inf')
        if sector_div:
            sector_link = sector_div.select_one('a[href*="/stocks/sector/"]')
            if sector_link:
                data["sector"] = sector_link.text.strip()
        
        # Try to get PE ratio
        pe_div = soup.select_one('div.nsepedivcot')
        if pe_div:
            pe_text = pe_div.text
            if "P/E" in pe_text:
                pe_parts = pe_text.split("P/E")[1].strip().split(" ")[0].replace(",", "")
                try:
                    data["pe_ratio"] = float(pe_parts)
                except ValueError:
                    pass
        
        # Try to get market cap
        market_cap_label = soup.find(string=lambda text: "MARKET CAP" in text.upper() if text else False)
        if market_cap_label:
            market_cap_div = market_cap_label.find_parent('div')
            if market_cap_div:
                market_cap_text = market_cap_div.find_next('div').text.strip().replace(",", "")
                # Parse value and convert to numeric (deal with cr, lakh, etc.)
                try:
                    if "cr" in market_cap_text.lower():
                        value = float(market_cap_text.lower().replace("cr", "").strip()) * 10000000  # 1 cr = 10,000,000
                        data["market_cap"] = value
                    elif "lakh" in market_cap_text.lower():
                        value = float(market_cap_text.lower().replace("lakh", "").strip()) * 100000  # 1 lakh = 100,000
                        data["market_cap"] = value
                except ValueError:
                    pass

        return data
        
    except Exception as e:
        logger.warning(f"Error getting data from MoneyControl for {company_name}: {e}")
        return None 