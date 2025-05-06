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

def get_nse_stock_list():
    CACHE_KEY = 'nse_stock_list'
    CACHE_TIMEOUT = 86400
    
    cached_data = cache.get(CACHE_KEY)
    if cached_data is not None:
        return cached_data
    
    try:
        csv_url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
        csv_response = requests.get(csv_url, timeout=10)
        csv_response.raise_for_status()
        
        csv_data = StringIO(csv_response.text)
        df = pd.read_csv(csv_data)

        stocks = df[['SYMBOL', 'NAME OF COMPANY']].rename(
            columns={'SYMBOL': 'symbol', 'NAME OF COMPANY': 'companyName'}
        )
        
        cache.set(CACHE_KEY, stocks, CACHE_TIMEOUT)
        return stocks
    
    except requests.exceptions.RequestException as e:
        stale_data = cache.get(CACHE_KEY)
        return stale_data if stale_data else pd.DataFrame(columns=['symbol', 'companyName'])
    
    except Exception as e:
        stale_data = cache.get(CACHE_KEY)
        return stale_data if stale_data else pd.DataFrame(columns=['symbol', 'companyName'])

def get_stock_price_data(symbol, period='1y'):
    try:
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            symbol = f"{symbol}.NS"
        
        stock = yf.Ticker(symbol)
        hist = stock.history(period=period)
        
        if hist.empty or 'Close' not in hist.columns:
            return None
            
        return hist
    except Exception as e:
        return None

def get_fundamental_data(symbol):
    try:
        if not symbol.endswith('.NS') and not symbol.endswith('.BO'):
            symbol = f"{symbol}.NS"
            
        stock = yf.Ticker(symbol)
        info = stock.info
        
        fundamentals = {
            'pe_ratio': info.get('trailingPE', 0),
            'pbv_ratio': info.get('priceToBook', 0),
            'dividend_yield': info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0,
            'market_cap': info.get('marketCap', 0),
            'beta': info.get('beta', 0),
            'target_price': info.get('targetMeanPrice', 0),
            'debt_to_equity': info.get('debtToEquity', 0),
            'profit_margin': info.get('profitMargins', 0) * 100 if info.get('profitMargins') else 0,
            'current_ratio': info.get('currentRatio', 0),
            'roe': info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0,
            'eps': info.get('trailingEps', 0),
            '52_week_high': info.get('fiftyTwoWeekHigh', 0),
            '52_week_low': info.get('fiftyTwoWeekLow', 0),
            'recommendation': info.get('recommendationKey', 'hold').capitalize(),
            'analyst_recommendation': info.get('recommendationKey', 'hold').capitalize(),
            'book_value': info.get('bookValue', 0),
            'industry_pe': info.get('industryPE', 0)
        }
        
        return fundamentals, info
    except Exception as e:
        return {}, {}

def calculate_technical_indicators(df):
    try:
        df = df.copy()
        
        # Moving Averages
        df['SMA20'] = ta.sma(df['Close'], length=20)
        df['SMA50'] = ta.sma(df['Close'], length=50)
        df['SMA200'] = ta.sma(df['Close'], length=200)
        
        # Oscillators
        df['RSI'] = ta.rsi(df['Close'], length=14)
        macd = ta.macd(df['Close'])
        df = pd.concat([df, macd], axis=1)
        
        # Volatility
        bollinger = ta.bbands(df['Close'], length=20)
        df = pd.concat([df, bollinger], axis=1)
        
        # Volume
        df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
        df['OBV'] = ta.obv(df['Close'], df['Volume'])
        
        # Momentum
        stoch = ta.stoch(df['High'], df['Low'], df['Close'])
        df = pd.concat([df, stoch], axis=1)
        
        return df
    except Exception as e:
        return df

def analyze_stock_health(price_data, fundamentals, info):
    try:
        analysis = {
            'technical_signal': 'Neutral',
            'fundamental_health': 'Neutral',
            'risk_level': 'Medium',
            'health_score': 0,
            'technical_score': 0,
            'fundamental_score': 0,
            'key_metrics': {},
            'signals': [],
            'entry_point': None,
            'exit_point': None,
            'one_month_prediction': 0,
            'six_month_prediction': 0,
            'summary': '',
            'current_price': price_data['Close'].iloc[-1],
            'charts': {},
            'news': []
        }

        tech_data = calculate_technical_indicators(price_data)
        latest = tech_data.iloc[-1]
        current_price = analysis['current_price']

        # Technical Analysis
        technical_score = 0
        signals = []

        # Moving Average Analysis
        ma_signals = []
        if current_price > latest['SMA200']:
            technical_score += 10
            ma_signals.append("Above 200D MA")
        else:
            ma_signals.append("Below 200D MA")

        if current_price > latest['SMA50']:
            technical_score += 7
            ma_signals.append("Above 50D MA")
        else:
            ma_signals.append("Below 50D MA")

        if current_price > latest['SMA20']:
            technical_score += 5
            ma_signals.append("Above 20D MA")
        else:
            ma_signals.append("Below 20D MA")

        # Crossovers
        if tech_data['SMA50'].iloc[-1] > tech_data['SMA200'].iloc[-1] and tech_data['SMA50'].iloc[-2] <= tech_data['SMA200'].iloc[-2]:
            technical_score += 15
            signals.append("Golden Cross (50D > 200D)")
        elif tech_data['SMA50'].iloc[-1] < tech_data['SMA200'].iloc[-1] and tech_data['SMA50'].iloc[-2] >= tech_data['SMA200'].iloc[-2]:
            technical_score -= 15
            signals.append("Death Cross (50D < 200D)")

        # RSI Analysis
        rsi = latest['RSI']
        if rsi < 30:
            technical_score += 10
            signals.append(f"RSI {rsi:.1f} (Oversold)")
        elif rsi > 70:
            technical_score -= 10
            signals.append(f"RSI {rsi:.1f} (Overbought)")
        else:
            signals.append(f"RSI {rsi:.1f} (Neutral)")

        # MACD Analysis
        if latest['MACD_12_26_9'] > latest['MACDs_12_26_9']:
            technical_score += 10
            signals.append("MACD Bullish Crossover")
        else:
            signals.append("MACD Bearish Crossover")

        # Bollinger Bands
        if current_price < latest['BBL_20_2.0']:
            technical_score += 8
            signals.append("Below Lower Bollinger Band")
        elif current_price > latest['BBU_20_2.0']:
            technical_score -= 8
            signals.append("Above Upper Bollinger Band")
        else:
            signals.append("Within Bollinger Bands")

        # Volume Analysis
        avg_volume = price_data['Volume'].rolling(window=20).mean().iloc[-1]
        if price_data['Volume'].iloc[-1] > avg_volume * 1.5:
            if price_data['Close'].iloc[-1] > price_data['Close'].iloc[-2]:
                technical_score += 7
                signals.append("High Volume Up Move")
            else:
                technical_score -= 7
                signals.append("High Volume Down Move")

        # Fundamental Analysis
        fundamental_score = 0
        fund_signals = []

        # Valuation Metrics
        pe_ratio = fundamentals['pe_ratio']
        industry_pe = fundamentals['industry_pe']
        if pe_ratio < industry_pe * 0.8:
            fundamental_score += 15
            fund_signals.append(f"PE {pe_ratio:.1f} < Industry PE {industry_pe:.1f}")
        elif pe_ratio > industry_pe * 1.2:
            fundamental_score -= 10
            fund_signals.append(f"PE {pe_ratio:.1f} > Industry PE {industry_pe:.1f}")
        else:
            fund_signals.append(f"PE {pe_ratio:.1f} ≈ Industry PE {industry_pe:.1f}")

        # Profitability
        if fundamentals['roe'] > 15:
            fundamental_score += 10
            fund_signals.append(f"ROE {fundamentals['roe']:.1f}%")
        if fundamentals['profit_margin'] > 10:
            fundamental_score += 10
            fund_signals.append(f"Profit Margin {fundamentals['profit_margin']:.1f}%")

        # Solvency
        if fundamentals['debt_to_equity'] < 0.5:
            fundamental_score += 10
            fund_signals.append(f"Low Debt/Equity {fundamentals['debt_to_equity']:.2f}")
        elif fundamentals['debt_to_equity'] > 1.5:
            fundamental_score -= 10
            fund_signals.append(f"High Debt/Equity {fundamentals['debt_to_equity']:.2f}")

        # Analyst Sentiment
        if fundamentals['analyst_recommendation'] in ['Buy', 'Strong Buy']:
            fundamental_score += 15
            fund_signals.append(f"{fundamentals['analyst_recommendation']} Consensus")
        elif fundamentals['analyst_recommendation'] == 'Sell':
            fundamental_score -= 15
            fund_signals.append("Sell Consensus")

        # Price Targets
        if fundamentals['target_price'] > current_price:
            upside = ((fundamentals['target_price'] - current_price) / current_price) * 100
            fundamental_score += min(15, upside)
            fund_signals.append(f"{upside:.1f}% Upside to Target")
        else:
            fund_signals.append("Below Target Price")

        # Normalize Scores
        technical_score = max(min(technical_score + 50, 100), 0)
        fundamental_score = max(min(fundamental_score + 50, 100), 0)
        health_score = (technical_score * 0.6) + (fundamental_score * 0.4)

        # Determine Recommendations
        if health_score >= 75:
            analysis['technical_signal'] = "Strong Buy"
            analysis['risk_level'] = "Low"
        elif health_score >= 60:
            analysis['technical_signal'] = "Buy"
            analysis['risk_level'] = "Medium"
        elif health_score >= 40:
            analysis['technical_signal'] = "Hold"
            analysis['risk_level'] = "Medium"
        elif health_score >= 25:
            analysis['technical_signal'] = "Sell"
            analysis['risk_level'] = "High"
        else:
            analysis['technical_signal'] = "Strong Sell"
            analysis['risk_level'] = "High"

        analysis.update({
            'technical_score': technical_score,
            'fundamental_score': fundamental_score,
            'health_score': health_score,
            'fundamental_health': "Strong" if fundamental_score >= 60 else "Weak",
            'signals': signals + fund_signals,
            'key_metrics': {
                'pe': fundamentals['pe_ratio'],
                'pbv': fundamentals['pbv_ratio'],
                'dividend_yield': fundamentals['dividend_yield'],
                'market_cap': fundamentals['market_cap'],
                'beta': fundamentals['beta'],
                'target_price': fundamentals['target_price'],
                'debt_to_equity': fundamentals['debt_to_equity'],
                'profit_margin': fundamentals['profit_margin'],
                'current_ratio': fundamentals['current_ratio'],
                'roe': fundamentals['roe'],
                'eps': fundamentals['eps'],
                '52_week_high': fundamentals['52_week_high'],
                '52_week_low': fundamentals['52_week_low'],
                'book_value': fundamentals['book_value']
            },
            'charts': generate_stock_charts(price_data),
            'summary': f"{analysis['technical_signal']} - {fundamentals['recommendation']} Recommendation | " +
                      f"Health Score: {health_score:.0f}/100 | " +
                      f"Technical: {technical_score:.0f}/100 | " +
                      f"Fundamental: {fundamental_score:.0f}/100"
        })

        return analysis
    except Exception as e:
        return {
            'error': str(e),
            'health_score': 0,
            'technical_score': 0,
            'fundamental_score': 0,
            'signals': [],
            'summary': 'Analysis failed'
        }

def generate_stock_charts(price_data):
    try:
        charts = {}
        df = calculate_technical_indicators(price_data)
        
        # Price and Moving Averages
        plt.figure(figsize=(10, 6))
        plt.plot(df.index, df['Close'], label='Price')
        plt.plot(df.index, df['SMA20'], label='20D MA', alpha=0.7)
        plt.plot(df.index, df['SMA50'], label='50D MA', alpha=0.7)
        plt.plot(df.index, df['SMA200'], label='200D MA', alpha=0.7)
        plt.title('Price Trend')
        plt.legend()
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        charts['trend'] = "data:image/png;base64," + base64.b64encode(img_buf.getvalue()).decode()
        plt.close()

        # RSI Chart
        plt.figure(figsize=(10, 4))
        plt.plot(df.index, df['RSI'], label='RSI', color='purple')
        plt.axhline(70, color='red', linestyle='--')
        plt.axhline(30, color='green', linestyle='--')
        plt.title('RSI Indicator')
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        charts['rsi'] = "data:image/png;base64," + base64.b64encode(img_buf.getvalue()).decode()
        plt.close()

        return charts
    except Exception as e:
        return {}

# Rest of the original functions remain unchanged below this line
# [Keep all existing functions for market data, news, etc. without modification]
# ... (get_stock_news, get_index_data, get_top_gainers_losers, 
#      get_random_stocks, get_mutual_fund_data, get_commodity_data)

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
        
        # Get company info for accurate name
        stock = yf.Ticker(ticker_symbol)
        company_name = stock.info.get('shortName', search_symbol)
        
        # Try to get news from Yahoo Finance
        news_items = []
        
        # Use both symbol and company name for better results
        search_terms = [search_symbol, company_name]
        
        for term in search_terms:
            if len(news_items) >= 5:  # Limit to 5 news items
                break
                
            url = f"https://news.google.com/rss/search?q={term}+stock+market&hl=en-IN&gl=IN&ceid=IN:en"
            response = requests.get(url)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')
                
                for item in items[:5]:  # Get at most 5 items
                    title = item.title.text
                    link = item.link.text
                    pub_date = item.pubDate.text
                    
                    # Check if news is already in the list
                    if not any(news['title'] == title for news in news_items):
                        news_items.append({
                            'title': title,
                            'link': link,
                            'date': pub_date
                        })
        
        return news_items[:5]  # Return at most 5 news items
    except Exception as e:
        print(f"Error fetching stock news: {e}")
        return []



# === New Code for Additional Data Collection ===
# Line ~150: Add the following functions

def get_index_data(index_symbol, period="1d"):
    """
    Fetch index data for the given index symbol from yfinance.
    Example index symbols:
      Nifty 50: '^NSEI'
      Bank Nifty: '^NSEBANK'
    """
    try:
        index = yf.Ticker(index_symbol)
        data = index.history(period=period)
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
        stocks = get_nse_stock_list()
        # Limit to a sample to avoid too many API calls
        sample_stocks = stocks.head(sample_size)
        changes = []
        for symbol in sample_stocks['symbol']:
            data = get_stock_price_data(symbol, period="2d")
            if data is not None and len(data) >= 2:
                prev_close = data['Close'].iloc[-2]
                current = data['Close'].iloc[-1]
                change_pct = ((current - prev_close) / prev_close) * 100
                changes.append((symbol, change_pct))
        if not changes:
            return [], []
        # Sort gainers (highest positive change) and losers (lowest, i.e. most negative change)
        sorted_changes = sorted(changes, key=lambda x: x[1], reverse=True)
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
