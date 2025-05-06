from django.core.cache import cache
import pandas as pd
import numpy as np
import requests
import json
import yfinance as yf
from datetime import datetime, timedelta
import pandas_ta as ta
import matplotlib.pyplot as plt
import io
import base64
from bs4 import BeautifulSoup
import os
from io import StringIO
import logging

logger = logging.getLogger(__name__)


def get_nse_stock_list():
    """
    Fetch all NSE listed stocks from the CSV file with caching.
    Cache expires after 24 hours (86400 seconds) or when manually invalidated.
    """
    CACHE_KEY = 'nse_stock_list'
    CACHE_TIMEOUT = 86400  # 24 hours in seconds
    
    # Try to get cached data first
    cached_data = cache.get(CACHE_KEY)
    if cached_data is not None:
        return cached_data
    
    try:
        # Download NSE stock list CSV
        csv_url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        csv_response = requests.get(csv_url, timeout=10)
        csv_response.raise_for_status()  # Raise error if download fails
        
        # Read CSV content
        csv_data = StringIO(csv_response.text)
        df = pd.read_csv(csv_data)

        # Extract symbol and company name columns
        stocks = df[['SYMBOL', 'NAME OF COMPANY']].rename(
            columns={'SYMBOL': 'symbol', 'NAME OF COMPANY': 'companyName'}
        )
        
        # Cache the result
        cache.set(CACHE_KEY, stocks, CACHE_TIMEOUT)
        
        return stocks
    
    except requests.exceptions.RequestException as e:
        print(f"Network error fetching NSE stock list: {e}")
        # Return cached data even if stale if available
        stale_data = cache.get(CACHE_KEY)
        if stale_data is not None:
            return stale_data
        return pd.DataFrame(columns=['symbol', 'companyName'])
    
    except Exception as e:
        print(f"Error processing NSE stock list: {e}")
        # Return cached data even if stale if available
        stale_data = cache.get(CACHE_KEY)
        if stale_data is not None:
            return stale_data
        return pd.DataFrame(columns=['symbol', 'companyName'])


def get_stock_price_data(symbol, period='1y'):
    """
    Get historical price data for a given stock symbol
    """
    try:
        # Use cache if available
        cache_key = f'stock_price_{symbol}_{period}'
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data
            
        # Add .NS suffix if not present for NSE stocks
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            symbol = f"{symbol}.NS"
        
        logger.info(f"Fetching price data for {symbol} with period {period}")
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        
        # Check if we have data
        if hist.empty or 'Close' not in hist.columns:
            logger.warning(f"No data returned for {symbol}")
            
            # Try with .BO suffix if .NS didn't work
            if symbol.endswith('.NS'):
                logger.info(f"Trying with .BO suffix instead of .NS for {symbol}")
                symbol_bo = symbol.replace('.NS', '.BO')
                stock_bo = yf.Ticker(symbol_bo)
                hist_bo = stock_bo.history(period=period)
                
                if not hist_bo.empty and 'Close' in hist_bo.columns:
                    logger.info(f"Successfully fetched data for {symbol_bo}")
                    # Cache for 1 hour
                    cache.set(cache_key, hist_bo, 60*60)
                    return hist_bo
            
            return None  # Return None instead of empty DataFrame
        
        # Cache for 1 hour
        cache.set(cache_key, hist, 60*60)
        return hist
    except Exception as e:
        logger.error(f"Error fetching stock price data for {symbol}: {e}")
        return None

def get_fundamental_data(symbol):
    """
    Get fundamental data for stock analysis
    """
    try:
        # Check cache first
        cache_key = f'fundamental_data_{symbol}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
            
        # Add .NS suffix if not present
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            symbol = f"{symbol}.NS"
            
        logger.info(f"Fetching fundamental data for {symbol}")
        stock = yf.Ticker(symbol)
        
        # Get key statistics
        info = stock.info
        
        # Check if we got valid data
        if not info or not isinstance(info, dict) or len(info) < 5:
            logger.warning(f"Limited data available for {symbol}, trying with .BO suffix")
            
            # Try with .BO suffix if .NS didn't work
            if symbol.endswith('.NS'):
                symbol_bo = symbol.replace('.NS', '.BO')
                stock_bo = yf.Ticker(symbol_bo)
                info = stock_bo.info
        
        # Prepare fundamental data
        fundamentals = {
            'Market Cap': info.get('marketCap', 'N/A'),
            'PE Ratio': info.get('trailingPE', 'N/A'),
            'EPS': info.get('trailingEps', 'N/A'),
            'Dividend Yield': info.get('dividendYield', 'N/A') * 100 if info.get('dividendYield') else 'N/A',
            'Book Value': info.get('bookValue', 'N/A'),
            'PB Ratio': info.get('priceToBook', 'N/A'),
            'ROE': info.get('returnOnEquity', 'N/A') * 100 if info.get('returnOnEquity') else 'N/A',
            'Debt to Equity': info.get('debtToEquity', 'N/A'),
            'Current Ratio': info.get('currentRatio', 'N/A'),
            'Profit Margin': info.get('profitMargins', 'N/A') * 100 if info.get('profitMargins') else 'N/A',
            '52 Week High': info.get('fiftyTwoWeekHigh', 'N/A'),
            '52 Week Low': info.get('fiftyTwoWeekLow', 'N/A'),
            'Analysts Recommendation': info.get('recommendationKey', 'N/A').capitalize(),
            'Target Price': info.get('targetMeanPrice', 'N/A'),
        }
        
        # Cache results for 6 hours (fundamentals don't change as often as prices)
        cache.set(cache_key, (fundamentals, info), 60*60*6)
        
        return fundamentals, info
    except Exception as e:
        logger.error(f"Error fetching fundamental data for {symbol}: {e}")
        return {}, {}

def calculate_technical_indicators(df):
    """
    Calculate various technical indicators
    """
    try:
        # Check if dataframe is valid and has required columns
        if df is None or df.empty:
            raise ValueError("Invalid or empty dataframe provided")
            
        required_columns = ['Close', 'High', 'Low', 'Volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
            
        # Make sure we have sufficient data for calculations (at least 200 days for longest MA)
        if len(df) < 20:
            raise ValueError(f"Insufficient data points ({len(df)}) for technical indicators. Need at least 20.")
        
        # Create a copy to avoid modifying the original dataframe
        df = df.copy()
        
        # Make sure there are no NaN values in price data
        df['Close'] = df['Close'].ffill()
        df['High'] = df['High'].fillna(df['Close'])
        df['Low'] = df['Low'].fillna(df['Close'])
        df['Volume'] = df['Volume'].fillna(0)
        
        try:
            # Calculate Moving Averages - handle shorter dataframes gracefully
            if len(df) >= 20:
                df['SMA20'] = ta.sma(df['Close'], length=20)
            else:
                df['SMA20'] = df['Close'].rolling(window=min(len(df), 20)).mean()
                
            if len(df) >= 50:
                df['SMA50'] = ta.sma(df['Close'], length=50)
            else:
                df['SMA50'] = df['Close'].rolling(window=min(len(df), 50)).mean()
                
            if len(df) >= 200:
                df['SMA200'] = ta.sma(df['Close'], length=200)
            else:
                df['SMA200'] = df['Close'].rolling(window=min(len(df), 200)).mean()
        except Exception as e:
            print(f"Error calculating SMA: {e}")
            # Fallback to pandas implementation
            df['SMA20'] = df['Close'].rolling(window=min(len(df), 20)).mean()
            df['SMA50'] = df['Close'].rolling(window=min(len(df), 50)).mean()
            df['SMA200'] = df['Close'].rolling(window=min(len(df), 200)).mean()
        
        try:
            # Calculate RSI
            df['RSI'] = ta.rsi(df['Close'], length=14)
        except Exception as e:
            print(f"Error calculating RSI: {e}")
            # Leave as NaN if calculation fails
            df['RSI'] = np.nan
        
        try:
            # Calculate MACD
            macd = ta.macd(df['Close'])
            df = pd.concat([df, macd], axis=1)
        except Exception as e:
            print(f"Error calculating MACD: {e}")
            # Create empty MACD columns
            df['MACD_12_26_9'] = np.nan
            df['MACDs_12_26_9'] = np.nan
            df['MACDh_12_26_9'] = np.nan
        
        try:
            # Calculate Bollinger Bands
            bollinger = ta.bbands(df['Close'], length=20)
            df = pd.concat([df, bollinger], axis=1)
        except Exception as e:
            print(f"Error calculating Bollinger Bands: {e}")
            # Calculate simplified Bollinger Bands
            df['BBM_20_2.0'] = df['SMA20']
            df['BBU_20_2.0'] = df['SMA20'] + (df['Close'].rolling(window=20).std() * 2)
            df['BBL_20_2.0'] = df['SMA20'] - (df['Close'].rolling(window=20).std() * 2)
        
        try:
            # Calculate Average True Range
            df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
        except Exception as e:
            print(f"Error calculating ATR: {e}")
            df['ATR'] = np.nan
        
        try:
            # Calculate stochastic oscillator
            stoch = ta.stoch(df['High'], df['Low'], df['Close'])
            df = pd.concat([df, stoch], axis=1)
        except Exception as e:
            print(f"Error calculating Stochastic: {e}")
            # Create empty stochastic columns
            df['STOCHk_14_3_3'] = np.nan
            df['STOCHd_14_3_3'] = np.nan
        
        try:
            # Calculate OBV (On-Balance Volume)
            df['OBV'] = ta.obv(df['Close'], df['Volume'])
        except Exception as e:
            print(f"Error calculating OBV: {e}")
            # Implement a simple OBV calculation
            obv = 0
            obv_list = []
            for i in range(len(df)):
                if i > 0:
                    if df['Close'].iloc[i] > df['Close'].iloc[i-1]:
                        obv += df['Volume'].iloc[i]
                    elif df['Close'].iloc[i] < df['Close'].iloc[i-1]:
                        obv -= df['Volume'].iloc[i]
                obv_list.append(obv)
            df['OBV'] = obv_list
        
        # Final check for NaN/Inf values and replace with meaningful values
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        
        # Forward fill any remaining NaN values
        df.ffill(inplace=True)
        
        # If still NaN (beginning of series), backward fill
        df.bfill(inplace=True)
        
        # Any remaining NaNs become zeros
        df.fillna(0, inplace=True)
        
        return df
    except Exception as e:
        print(f"Error calculating technical indicators: {e}")
        # If all else fails, return the original dataframe
        if df is not None and not df.empty:
            return df
        else:
            # Return an empty dataframe with the expected columns
            return pd.DataFrame(columns=['Close', 'SMA20', 'SMA50', 'SMA200', 'RSI', 
                                        'MACD_12_26_9', 'MACDs_12_26_9', 'MACDh_12_26_9',
                                        'BBL_20_2.0', 'BBM_20_2.0', 'BBU_20_2.0', 'ATR',
                                        'STOCHk_14_3_3', 'STOCHd_14_3_3', 'OBV'])

def analyze_stock_health(price_data, fundamentals, info):
    """
    Analyze stock health and generate score and recommendations
    """
    try:
        # Check if price data is valid and not empty
        if price_data is None or price_data.empty or 'Close' not in price_data.columns:
            raise ValueError("Invalid or empty price data")
            
        health_score = 0
        fundamental_score = 0
        technical_score = 0
        signals = []
        
        # Get current price
        current_price = price_data['Close'].iloc[-1]
        
        # Technical Analysis
        # Get the data with indicators
        tech_data = calculate_technical_indicators(price_data)
        
        # Make sure we have enough data after indicators calculation
        if tech_data.empty or len(tech_data) < 2:
            raise ValueError("Insufficient data after calculating indicators")
            
        latest = tech_data.iloc[-1]
        
        # Price vs Moving Average Analysis
        # Make sure we have the SMA columns
        if 'SMA200' in latest and not pd.isna(latest['SMA200']):
            if current_price > latest['SMA200']:
                technical_score += 10
                signals.append("Price above 200-day MA: Bullish long-term trend")
            else:
                signals.append("Price below 200-day MA: Bearish long-term trend")
        
        if 'SMA50' in latest and not pd.isna(latest['SMA50']):
            if current_price > latest['SMA50']:
                technical_score += 7
                signals.append("Price above 50-day MA: Bullish medium-term trend")
            else:
                signals.append("Price below 50-day MA: Bearish medium-term trend")
        
        if 'SMA20' in latest and not pd.isna(latest['SMA20']):
            if current_price > latest['SMA20']:
                technical_score += 5
                signals.append("Price above 20-day MA: Bullish short-term trend")
            else:
                signals.append("Price below 20-day MA: Bearish short-term trend")
            
        # Check for golden/death cross
        if (len(tech_data) >= 3 and 'SMA50' in tech_data.columns and 'SMA200' in tech_data.columns 
            and not pd.isna(tech_data['SMA50'].iloc[-1]) and not pd.isna(tech_data['SMA50'].iloc[-2])
            and not pd.isna(tech_data['SMA200'].iloc[-1]) and not pd.isna(tech_data['SMA200'].iloc[-2])):
            
            if tech_data['SMA50'].iloc[-1] > tech_data['SMA200'].iloc[-1] and tech_data['SMA50'].iloc[-2] <= tech_data['SMA200'].iloc[-2]:
                technical_score += 15
                signals.append("Golden Cross detected: Strong bullish signal")
            elif tech_data['SMA50'].iloc[-1] < tech_data['SMA200'].iloc[-1] and tech_data['SMA50'].iloc[-2] >= tech_data['SMA200'].iloc[-2]:
                technical_score -= 15
                signals.append("Death Cross detected: Strong bearish signal")
            
        # RSI Analysis
        if 'RSI' in latest and not pd.isna(latest['RSI']):
            if latest['RSI'] < 30:
                technical_score += 10
                signals.append(f"RSI is {latest['RSI']:.2f}: Oversold, potential buying opportunity")
            elif latest['RSI'] > 70:
                technical_score -= 10
                signals.append(f"RSI is {latest['RSI']:.2f}: Overbought, potential selling opportunity")
            else:
                technical_score += 5
                signals.append(f"RSI is {latest['RSI']:.2f}: Neutral")
            
        # MACD Analysis
        if ('MACD_12_26_9' in latest and 'MACDs_12_26_9' in latest 
            and not pd.isna(latest['MACD_12_26_9']) and not pd.isna(latest['MACDs_12_26_9'])):
            if latest['MACD_12_26_9'] > latest['MACDs_12_26_9']:
                technical_score += 10
                signals.append("MACD above Signal Line: Bullish momentum")
            else:
                technical_score -= 5
                signals.append("MACD below Signal Line: Bearish momentum")
            
        # Bollinger Bands Analysis
        if ('BBL_20_2.0' in latest and 'BBU_20_2.0' in latest 
            and not pd.isna(latest['BBL_20_2.0']) and not pd.isna(latest['BBU_20_2.0'])):
            if current_price < latest['BBL_20_2.0']:
                technical_score += 8
                signals.append("Price below lower Bollinger Band: Potentially oversold")
            elif current_price > latest['BBU_20_2.0']:
                technical_score -= 8
                signals.append("Price above upper Bollinger Band: Potentially overbought")
            else:
                signals.append("Price within Bollinger Bands: Neutral")
            
        # Volume Analysis
        if 'Volume' in price_data.columns and len(price_data) >= 20:
            volume_series = price_data['Volume'].replace(0, np.nan).dropna()
            if len(volume_series) >= 20:
                avg_volume = volume_series.rolling(window=20).mean().iloc[-1]
                last_volume = price_data['Volume'].iloc[-1]
                if not pd.isna(avg_volume) and not pd.isna(last_volume) and avg_volume > 0:
                    if last_volume > avg_volume * 1.5 and price_data['Close'].iloc[-1] > price_data['Close'].iloc[-2]:
                        technical_score += 7
                        signals.append("High volume on up day: Strong buying interest")
                    elif last_volume > avg_volume * 1.5 and price_data['Close'].iloc[-1] < price_data['Close'].iloc[-2]:
                        technical_score -= 7
                        signals.append("High volume on down day: Strong selling pressure")
        
        # Normalize technical score to 0-100
        technical_score = min(max(technical_score + 50, 0), 100)
        
        # Fundamental Analysis
        # Make sure fundamentals is a dictionary
        if not isinstance(fundamentals, dict):
            fundamentals = {}
        
        # PE Ratio analysis
        pe_ratio = fundamentals.get('PE Ratio', fundamentals.get('pe_ratio', None))
        if isinstance(pe_ratio, (int, float)) and pe_ratio > 0:
            # Get industry PE (default to 20 if not available)
            industry_pe = 20
            if isinstance(info, dict):
                industry_pe = info.get('trailingPE', industry_pe)
            
            if pe_ratio < industry_pe * 0.8:
                fundamental_score += 15
                signals.append(f"PE Ratio ({pe_ratio:.2f}) is below industry average: Potentially undervalued")
            elif pe_ratio > industry_pe * 1.2:
                fundamental_score -= 10
                signals.append(f"PE Ratio ({pe_ratio:.2f}) is above industry average: Potentially overvalued")
            else:
                signals.append(f"PE Ratio ({pe_ratio:.2f}) is near industry average: Fair valuation")
        
        # Check dividend yield
        div_yield = fundamentals.get('Dividend Yield', fundamentals.get('dividend_yield', None))
        if isinstance(div_yield, (int, float)) and div_yield > 0:
            if div_yield > 3:
                fundamental_score += 10
                signals.append(f"Good dividend yield of {div_yield:.2f}%")
            else:
                signals.append(f"Dividend yield of {div_yield:.2f}%")
        
        # Check debt to equity
        debt_equity = fundamentals.get('Debt to Equity', fundamentals.get('debt_to_equity', None))
        if isinstance(debt_equity, (int, float)) and debt_equity >= 0:  # Ensure it's not negative
            if debt_equity < 0.5:
                fundamental_score += 10
                signals.append(f"Low debt-to-equity ratio: {debt_equity:.2f}")
            elif debt_equity > 1.5:
                fundamental_score -= 10
                signals.append(f"High debt-to-equity ratio: {debt_equity:.2f}")
            else:
                signals.append(f"Moderate debt-to-equity ratio: {debt_equity:.2f}")
        
        # Check return on equity
        roe = fundamentals.get('ROE', fundamentals.get('return_on_equity', None))
        if isinstance(roe, (int, float)):
            if roe > 15:
                fundamental_score += 10
                signals.append(f"Strong Return on Equity: {roe:.2f}%")
            elif roe > 10:
                fundamental_score += 5
                signals.append(f"Good Return on Equity: {roe:.2f}%")
            elif roe < 0:
                fundamental_score -= 10
                signals.append(f"Negative Return on Equity: {roe:.2f}%")
        
        # Check profit margin
        profit_margin = fundamentals.get('Profit Margin', fundamentals.get('profit_margin', None))
        if isinstance(profit_margin, (int, float)):
            if profit_margin > 10:
                fundamental_score += 10
                signals.append(f"Good profit margin: {profit_margin:.2f}%")
            elif profit_margin < 0:
                fundamental_score -= 10
                signals.append(f"Negative profit margin: {profit_margin:.2f}%")
        
        # Check analysts recommendation
        analyst_rec = fundamentals.get('Analysts Recommendation', '')
        if isinstance(analyst_rec, str):
            # Normalize recommendation string
            rec = analyst_rec.lower()
            if rec in ['buy', 'strong_buy', 'strong buy']:
                fundamental_score += 15
                signals.append(f"Analysts recommendation: {analyst_rec}")
            elif rec == 'sell':
                fundamental_score -= 15
                signals.append(f"Analysts recommendation: {analyst_rec}")
            elif rec == 'hold':
                signals.append(f"Analysts recommendation: {analyst_rec}")
        
        # Target price vs current price
        target_price = fundamentals.get('Target Price', fundamentals.get('target_price', None))
        if isinstance(target_price, (int, float)) and target_price > 0 and current_price > 0:
            upside = ((target_price / current_price) - 1) * 100
            if upside > 20:
                fundamental_score += 15
                signals.append(f"High upside potential: {upside:.2f}% to target price")
            elif upside > 10:
                fundamental_score += 10
                signals.append(f"Good upside potential: {upside:.2f}% to target price")
            elif upside > 0:
                fundamental_score += 5
                signals.append(f"Modest upside potential: {upside:.2f}% to target price")
            else:
                fundamental_score -= 5
                signals.append(f"Negative upside: {upside:.2f}% to target price")
        
        # 52-week high/low analysis
        high_52week = fundamentals.get('52 Week High', fundamentals.get('high_52_week', None))
        low_52week = fundamentals.get('52 Week Low', fundamentals.get('low_52_week', None))
        
        if (isinstance(high_52week, (int, float)) and isinstance(low_52week, (int, float)) 
            and high_52week > low_52week and high_52week > 0 and low_52week > 0):
            
            range_52wk = high_52week - low_52week
            position = (current_price - low_52week) / range_52wk
            
            if position < 0.2:
                fundamental_score += 10
                signals.append(f"Stock near 52-week low: Potential value opportunity")
            elif position > 0.8:
                fundamental_score -= 5
                signals.append(f"Stock near 52-week high: Limited upside potential")
            else:
                signals.append(f"Stock in mid-range of 52-week high/low")
        
        # Normalize fundamental score to 0-100
        fundamental_score = min(max(fundamental_score + 50, 0), 100)
        
        # Calculate overall health score (60% technical, 40% fundamental)
        health_score = (technical_score * 0.6) + (fundamental_score * 0.4)
        
        # Determine investment recommendation
        recommendation = ""
        entry_point = None
        exit_point = None
        
        if health_score >= 75:
            recommendation = "Strong Buy"
            # Calculate potential entry point (recent support or 5% below current price)
            try:
                support_level = min(price_data['Low'][-10:]) if len(price_data) >= 10 else current_price * 0.95
                entry_point = max(support_level, current_price * 0.95)
                # Calculate potential exit point (recent resistance or 15% above current price)
                resistance_level = max(price_data['High'][-30:]) if len(price_data) >= 30 else current_price * 1.15
                exit_point = max(resistance_level, current_price * 1.15)
            except Exception:
                entry_point = current_price * 0.95
                exit_point = current_price * 1.15
        elif health_score >= 60:
            recommendation = "Buy"
            # Calculate potential entry point (recent support or 3% below current price)
            try:
                support_level = min(price_data['Low'][-10:]) if len(price_data) >= 10 else current_price * 0.97
                entry_point = max(support_level, current_price * 0.97)
                # Calculate potential exit point (10% above current price)
                exit_point = current_price * 1.1
            except Exception:
                entry_point = current_price * 0.97
                exit_point = current_price * 1.1
        elif health_score >= 40:
            recommendation = "Hold"
            # No specific entry/exit points for hold recommendation
        elif health_score >= 25:
            recommendation = "Sell"
            # For sell, we provide a potential exit point (current price)
            exit_point = current_price
        else:
            recommendation = "Strong Sell"
            # For strong sell, we provide a potential exit point (current price)
            exit_point = current_price
        
        # Format entry and exit points
        if entry_point:
            entry_point = round(entry_point, 2)
        if exit_point:
            exit_point = round(exit_point, 2)
        
        # Return analysis results
        return {
            'health_score': round(health_score, 2),
            'technical_score': round(technical_score, 2),
            'fundamental_score': round(fundamental_score, 2),
            'recommendation': recommendation,
            'entry_point': entry_point,
            'exit_point': exit_point,
            'signals': signals,
            'current_price': current_price
        }
    
    except Exception as e:
        logger.error(f"Error analyzing stock health: {e}")
        return {
            'health_score': 0,
            'technical_score': 0,
            'fundamental_score': 0,
            'recommendation': "Error in analysis",
            'entry_point': None,
            'exit_point': None,
            'signals': [f"Analysis error: {str(e)}"],
            'current_price': None
        }

def generate_stock_charts(price_data):
    """
    Generate price and technical indicator charts for the stock
    """
    try:
        charts = {}
        
        # Add technical indicators
        df = calculate_technical_indicators(price_data)
        
        # Price with Moving Averages chart
        plt.figure(figsize=(10, 6))
        plt.plot(df.index, df['Close'], label='Close Price')
        plt.plot(df.index, df['SMA20'], label='20-day SMA', alpha=0.7)
        plt.plot(df.index, df['SMA50'], label='50-day SMA', alpha=0.7)
        plt.plot(df.index, df['SMA200'], label='200-day SMA', alpha=0.7)
        plt.title('Price and Moving Averages')
        plt.xlabel('Date')
        plt.ylabel('Price')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Convert plot to base64 encoded image
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_str = "data:image/png;base64," + base64.b64encode(img_buf.read()).decode()
        plt.close()
        charts['price_ma'] = img_str
        
        # RSI chart
        plt.figure(figsize=(10, 4))
        plt.plot(df.index, df['RSI'], label='RSI', color='purple')
        plt.axhline(y=70, color='r', linestyle='--', alpha=0.5)
        plt.axhline(y=30, color='g', linestyle='--', alpha=0.5)
        plt.title('Relative Strength Index (RSI)')
        plt.xlabel('Date')
        plt.ylabel('RSI')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Convert plot to base64 encoded image
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_str = "data:image/png;base64," + base64.b64encode(img_buf.read()).decode()
        plt.close()
        charts['rsi'] = img_str
        
        # MACD chart
        plt.figure(figsize=(10, 4))
        plt.plot(df.index, df['MACD_12_26_9'], label='MACD', color='blue')
        plt.plot(df.index, df['MACDs_12_26_9'], label='Signal Line', color='red')
        plt.bar(df.index, df['MACDh_12_26_9'], label='Histogram', color='gray', alpha=0.5)
        plt.title('MACD (Moving Average Convergence Divergence)')
        plt.xlabel('Date')
        plt.ylabel('MACD')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Convert plot to base64 encoded image
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_str = "data:image/png;base64," + base64.b64encode(img_buf.read()).decode()
        plt.close()
        charts['macd'] = img_str
        
        # Bollinger Bands chart
        plt.figure(figsize=(10, 6))
        plt.plot(df.index, df['Close'], label='Close Price')
        plt.plot(df.index, df['BBU_20_2.0'], label='Upper Band', color='green', alpha=0.7)
        plt.plot(df.index, df['BBM_20_2.0'], label='Middle Band', color='blue', alpha=0.7)
        plt.plot(df.index, df['BBL_20_2.0'], label='Lower Band', color='red', alpha=0.7)
        plt.title('Bollinger Bands')
        plt.xlabel('Date')
        plt.ylabel('Price')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Convert plot to base64 encoded image
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_str = "data:image/png;base64," + base64.b64encode(img_buf.read()).decode()
        plt.close()
        charts['bollinger'] = img_str
        
        return charts
    except Exception as e:
        print(f"Error generating charts: {e}")
        return {}

def get_stock_news(symbol):
    """
    Get recent news about the stock
    """
    try:
        # Add .NS suffix if not present for NSE stocks
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            ticker_symbol = f"{symbol}.NS"
        else:
            ticker_symbol = symbol
            
        # Remove suffix for searching news
        search_symbol = symbol.replace('.NS', '').replace('.BO', '')
        
        # Try to get news from cache first
        cache_key = f'stock_news_{search_symbol}'
        cached_news = cache.get(cache_key)
        if cached_news:
            return cached_news
        
        # Get company info for accurate name
        try:
            stock = yf.Ticker(ticker_symbol)
            company_name = stock.info.get('shortName', search_symbol)
        except Exception:
            # If we can't get company name, use the symbol
            company_name = search_symbol
        
        # Try to get news from multiple sources
        news_items = []
        
        # Use both symbol and company name for better results
        search_terms = [search_symbol, company_name]
        
        for term in search_terms:
            if len(news_items) >= 5:  # Limit to 5 news items
                break
                
            # Try Google News RSS
            try:
                url = f"https://news.google.com/rss/search?q={term}+stock+market&hl=en-IN&gl=IN&ceid=IN:en"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    try:
                        # First try using xml parser
                        soup = BeautifulSoup(response.content, 'xml')
                        items = soup.find_all('item')
                        
                        # If xml parser didn't work, try html.parser
                        if not items:
                            soup = BeautifulSoup(response.content, 'html.parser')
                            items = soup.find_all('item')
                        
                        for item in items[:10]:  # Get at most 10 items
                            try:
                                title_tag = item.find('title')
                                link_tag = item.find('link')
                                date_tag = item.find('pubDate')
                                
                                if not title_tag or not link_tag:
                                    continue
                                    
                                title = title_tag.text.strip()
                                link = link_tag.text.strip() if link_tag.text else link_tag.get('href', '')
                                pub_date = date_tag.text.strip() if date_tag else ''
                                
                                # Check if news is already in the list
                                if not any(news['title'] == title for news in news_items):
                                    news_items.append({
                                        'title': title,
                                        'link': link,
                                        'date': pub_date
                                    })
                                    
                                    # If we have 5 items, stop
                                    if len(news_items) >= 5:
                                        break
                            except Exception as item_error:
                                print(f"Error processing news item: {item_error}")
                                continue
                    except Exception as parse_error:
                        print(f"Error parsing news XML: {parse_error}")
            except Exception as google_error:
                print(f"Error fetching news from Google: {google_error}")
            
            # If we still don't have enough news, try Yahoo Finance API
            if len(news_items) < 5:
                try:
                    ticker = yf.Ticker(ticker_symbol)
                    yahoo_news = ticker.news
                    
                    if yahoo_news:
                        for item in yahoo_news[:10]:
                            title = item.get('title', '')
                            link = item.get('link', '')
                            
                            # Format date from timestamp if available
                            pub_date = ''
                            if 'providerPublishTime' in item:
                                try:
                                    timestamp = item['providerPublishTime']
                                    pub_date = datetime.fromtimestamp(timestamp).strftime('%a, %d %b %Y %H:%M:%S')
                                except Exception:
                                    pass
                            
                            if title and link and not any(news['title'] == title for news in news_items):
                                news_items.append({
                                    'title': title,
                                    'link': link,
                                    'date': pub_date
                                })
                                
                                # If we have 5 items, stop
                                if len(news_items) >= 5:
                                    break
                except Exception as yahoo_error:
                    print(f"Error fetching news from Yahoo Finance: {yahoo_error}")
        
        # Sort news by date if possible (newest first)
        try:
            from dateutil import parser
            # Try to parse dates and sort
            for item in news_items:
                try:
                    if item['date']:
                        item['parsed_date'] = parser.parse(item['date'])
                    else:
                        item['parsed_date'] = datetime.now() - timedelta(days=30)  # Default old date
                except Exception:
                    item['parsed_date'] = datetime.now() - timedelta(days=30)  # Default old date
            
            news_items.sort(key=lambda x: x['parsed_date'], reverse=True)
            
            # Remove the parsed_date field
            for item in news_items:
                if 'parsed_date' in item:
                    del item['parsed_date']
        except Exception as sort_error:
            print(f"Error sorting news by date: {sort_error}")
        
        # Get at most 5 news items
        result = news_items[:5]
        
        # Cache the result for 2 hours
        if result:
            cache.set(cache_key, result, 60*60*2)
        
        return result
    except Exception as e:
        print(f"Error fetching stock news: {e}")
        return []



# === New Code for Additional Data Collection ===
# Line ~150: Add the following functions
def get_index_data(index_symbol, period="1d", interval="5m"):
    """
    Fetch index data for the given index symbol from yfinance.
    Example index symbols:
      Nifty 50: '^NSEI'
      Bank Nifty: '^NSEBANK'
    """
    try:
        index = yf.Ticker(index_symbol)
        data = index.history(period=period, interval=interval)
        return data
    except Exception as e:
        print(f"Error fetching index data for {index_symbol}: {e}")
        return None


def get_top_gainers_losers(sample_size=50):
    """
    Calculate top 5 gainers and top 5 losers from a sample of NSE stocks.
    NOTE: For performance, only a sample (default 50 stocks) is used.
    """
    try:
        import pandas as pd
        stocks = get_nse_stock_list()
        
        # Convert to DataFrame if it's a list
        if isinstance(stocks, list):
            stocks_df = pd.DataFrame(stocks)
        else:
            stocks_df = stocks
            
        # Limit to a sample to avoid too many API calls
        sample_stocks = stocks_df.head(sample_size)
        changes = []
        
        for i, row in sample_stocks.iterrows():
            symbol = row['symbol'] if 'symbol' in row else row.get('SYMBOL', '')
            if not symbol:
                continue
                
            data = get_stock_price_data(symbol, period="1d")
            if data is not None and len(data) >= 2:
                prev_close = data['Close'].iloc[-2]
                current = data['Close'].iloc[-1]
                change_pct = ((current - prev_close) / prev_close) * 100
                
                # Get company name if available
                company_name = row.get('company_name', row.get('companyName', row.get('NAME OF COMPANY', symbol)))
                
                # Add formatted info
                changes.append({
                    'symbol': symbol,
                    'company_name': company_name,
                    'change_percent': change_pct,
                    'current_price': current
                })
                
        if not changes:
            return [], []
            
        # Sort gainers (highest positive change) and losers (lowest, i.e. most negative change)
        sorted_changes = sorted(changes, key=lambda x: x['change_percent'], reverse=True)
        top_gainers = sorted_changes[:5]
        top_losers = sorted_changes[-5:]
        
        return top_gainers, top_losers
    except Exception as e:
        print(f"Error calculating top gainers/losers: {e}")
        return [], []



def get_random_stocks(n=6):
    """
    Fetch data for n randomly selected stocks from the NSE stock list.
    """
    try:
        stocks = get_nse_stock_list()
        random_symbols = stocks['symbol'].sample(n).tolist()
        data = {}
        for sym in random_symbols:
            stock_data = get_stock_price_data(sym)
            if stock_data is not None:
                data[sym] = stock_data
        return data
    except Exception as e:
        print(f"Error fetching random stocks: {e}")
        return {}

def get_mutual_fund_data(ticker, period="1y"):
    """
    Fetch historical data for a mutual fund ticker from yfinance.
    Pass the ticker symbol as listed on yfinance.
    """
    try:
        mf = yf.Ticker(ticker)
        data = mf.history(period=period)
        return data
    except Exception as e:
        print(f"Error fetching mutual fund data for {ticker}: {e}")
        return None

def get_commodity_data(ticker, period="1y"):
    """
    Fetch historical data for a commodity ticker from yfinance.
    Pass the ticker symbol as listed on yfinance.
    Example: 'GC=F' for Gold, 'CL=F' for Crude Oil.
    """
    try:
        commodity = yf.Ticker(ticker)
        data = commodity.history(period=period)
        return data
    except Exception as e:
        print(f"Error fetching commodity data for {ticker}: {e}")
        return None
