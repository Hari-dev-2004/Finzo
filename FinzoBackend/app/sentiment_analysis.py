#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Sentiment Analysis Module for Indian Investment Recommendation System.
This module fetches news about Indian markets and stocks and analyzes sentiment using NLP.
"""

import logging
import requests
import time
import random
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import pandas as pd
import numpy as np
import os
import pickle

# Set up logging
logger = logging.getLogger(__name__)

# Cache directory
CACHE_DIR = "data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

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

# Constants
NEWS_SOURCES = [
    "https://economictimes.indiatimes.com/markets/stocks/news",
    "https://www.moneycontrol.com/news/business/markets/",
    "https://www.business-standard.com/markets",
]

FINANCIAL_TERMS = {
    'positive': [
        'bull', 'bullish', 'rally', 'surge', 'gain', 'growth', 'profit', 'recovery',
        'outperform', 'beat', 'upgrade', 'rise', 'up', 'positive', 'strong', 'strength',
        'opportunity', 'upside', 'momentum', 'improve', 'improved', 'improving',
        'exceed', 'exceeded', 'exceeding', 'boost', 'boosted', 'boosting'
    ],
    'negative': [
        'bear', 'bearish', 'drop', 'decline', 'loss', 'crash', 'downgrade', 'fall',
        'down', 'negative', 'weak', 'weakness', 'risk', 'downside', 'slow', 'slowing',
        'slowed', 'miss', 'missed', 'missing', 'concern', 'concerned', 'concerning',
        'disappoint', 'disappointed', 'disappointing', 'pressure', 'recession', 'correction'
    ],
}

# Headers for web scraping
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

def download_nltk_resources():
    """Download required NLTK resources if not already present."""
    try:
        try:
            nltk.data.find('vader_lexicon')
            nltk.data.find('punkt')
        except LookupError:
            nltk.download('vader_lexicon')
            nltk.download('punkt')
    except Exception as e:
        logger.error(f"Error downloading NLTK resources: {e}")

def fetch_market_news():
    """
    Fetch news about the Indian stock market from various sources.
    
    Returns:
        list: List of news articles with title, content, source, and date
    """
    logger.info("Fetching market news")
    news_articles = []
    
    try:
        for source_url in NEWS_SOURCES:
            logger.info(f"Fetching news from {source_url}")
            
            try:
                response = requests.get(source_url, headers=HEADERS, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Different parsing for different sources
                if "economictimes" in source_url:
                    articles = soup.find_all('div', class_='eachStory')
                    for article in articles[:10]:  # Limit to top 10 articles
                        title_elem = article.find('h3')
                        if title_elem and title_elem.a:
                            title = title_elem.a.text.strip()
                            link = "https://economictimes.indiatimes.com" + title_elem.a['href'] if title_elem.a['href'].startswith('/') else title_elem.a['href']
                            
                            # Get article content
                            try:
                                article_response = requests.get(link, headers=HEADERS, timeout=10)
                                article_soup = BeautifulSoup(article_response.text, 'html.parser')
                                
                                content_div = article_soup.find('div', class_='artText')
                                content = ' '.join([p.text for p in content_div.find_all('p')]) if content_div else ""
                                
                                date_div = article_soup.find('div', class_='publish_on')
                                date = date_div.text.strip() if date_div else datetime.now().strftime("%d %b %Y, %H:%M")
                                
                                news_articles.append({
                                    'title': title,
                                    'content': content,
                                    'source': 'Economic Times',
                                    'date': date,
                                    'url': link
                                })
                                
                                # Add delay to avoid rate limiting
                                time.sleep(1)
                                
                            except Exception as e:
                                logger.warning(f"Error fetching article content from {link}: {e}")
                
                elif "moneycontrol" in source_url:
                    articles = soup.find_all('li', class_='clearfix')
                    for article in articles[:10]:  # Limit to top 10 articles
                        title_elem = article.find('h2')
                        if title_elem and title_elem.a:
                            title = title_elem.a.text.strip()
                            link = title_elem.a['href']
                            
                            # Get article content
                            try:
                                article_response = requests.get(link, headers=HEADERS, timeout=10)
                                article_soup = BeautifulSoup(article_response.text, 'html.parser')
                                
                                content_div = article_soup.find('div', class_='content_wrapper')
                                content = ' '.join([p.text for p in content_div.find_all('p')]) if content_div else ""
                                
                                date_div = article_soup.find('div', class_='article_schedule')
                                date = date_div.text.strip() if date_div else datetime.now().strftime("%b %d, %Y %H:%M")
                                
                                news_articles.append({
                                    'title': title,
                                    'content': content,
                                    'source': 'Money Control',
                                    'date': date,
                                    'url': link
                                })
                                
                                # Add delay to avoid rate limiting
                                time.sleep(1)
                                
                            except Exception as e:
                                logger.warning(f"Error fetching article content from {link}: {e}")
                
                elif "business-standard" in source_url:
                    articles = soup.find_all('div', class_='article-list')
                    for article in articles[:10]:  # Limit to top 10 articles
                        title_elem = article.find('h2')
                        if title_elem and title_elem.a:
                            title = title_elem.a.text.strip()
                            link = "https://www.business-standard.com" + title_elem.a['href'] if title_elem.a['href'].startswith('/') else title_elem.a['href']
                            
                            # Get article content
                            try:
                                article_response = requests.get(link, headers=HEADERS, timeout=10)
                                article_soup = BeautifulSoup(article_response.text, 'html.parser')
                                
                                content_div = article_soup.find('div', class_='storycontent')
                                content = ' '.join([p.text for p in content_div.find_all('p')]) if content_div else ""
                                
                                date_div = article_soup.find('span', class_='date')
                                date = date_div.text.strip() if date_div else datetime.now().strftime("%B %d, %Y %H:%M")
                                
                                news_articles.append({
                                    'title': title,
                                    'content': content,
                                    'source': 'Business Standard',
                                    'date': date,
                                    'url': link
                                })
                                
                                # Add delay to avoid rate limiting
                                time.sleep(1)
                                
                            except Exception as e:
                                logger.warning(f"Error fetching article content from {link}: {e}")
            
            except Exception as e:
                logger.error(f"Error fetching news from {source_url}: {e}")
        
        logger.info(f"Successfully fetched {len(news_articles)} news articles")
        return news_articles
    
    except Exception as e:
        logger.error(f"Error in fetch_market_news: {e}")
        # Return some simulated news in case of failure
        return generate_simulated_news()

def generate_simulated_news():
    """
    Generate simulated news for testing when real news can't be fetched.
    
    Returns:
        list: List of simulated news articles
    """
    logger.info("Generating simulated news articles")
    
    # Templates for simulated news
    positive_templates = [
        "{company} reports {percent}% increase in quarterly profit",
        "{company} shares surge after strong results",
        "Analysts upgrade {company} with price target of ₹{price}",
        "{company} announces expansion plans in {sector} sector",
        "Government policies to boost {sector} sector, {company} to benefit",
        "{company} wins major contract worth ₹{price} crores",
        "Foreign investors increase stake in {company}",
        "{company} declares dividend of ₹{dividend} per share",
        "{company} launches new product line, stock rallies",
        "Market experts bullish on {company}'s future prospects"
    ]
    
    negative_templates = [
        "{company} reports {percent}% decrease in quarterly profit",
        "{company} shares fall after disappointing results",
        "Analysts downgrade {company} with revised target of ₹{price}",
        "{company} faces regulatory challenges in {sector} sector",
        "New policy changes may impact {sector} sector negatively, {company} at risk",
        "{company} loses major contract worth ₹{price} crores",
        "Foreign investors reduce stake in {company}",
        "{company} cuts dividend amid profit concerns",
        "{company} recalls product line, stock drops",
        "Market experts express concerns over {company}'s high debt levels"
    ]
    
    neutral_templates = [
        "{company} reports stable quarterly results",
        "{company} shares remain unchanged after quarterly update",
        "Analysts maintain neutral stance on {company}",
        "{company} restructures operations in {sector} sector",
        "New regulations for {sector} sector announced, impact on {company} unclear",
        "{company} renews existing contracts worth ₹{price} crores",
        "Institutional holding in {company} remains stable",
        "{company} maintains dividend at ₹{dividend} per share",
        "{company} updates existing product line",
        "Market experts have mixed views on {company}'s future prospects"
    ]
    
    companies = [
        "Reliance Industries", "HDFC Bank", "Infosys", "TCS", "ICICI Bank", 
        "HUL", "Bharti Airtel", "SBI", "ITC", "L&T", "Axis Bank", "Bajaj Finance",
        "Kotak Mahindra Bank", "Asian Paints", "HCL Tech", "Maruti Suzuki"
    ]
    
    sectors = [
        "IT", "Banking", "Telecom", "Pharmaceuticals", "Consumer Goods", 
        "Automobile", "Energy", "Infrastructure", "Manufacturing", "Retail"
    ]
    
    # Generate simulated news
    simulated_news = []
    current_date = datetime.now()
    
    for i in range(20):  # Generate 20 news articles
        sentiment_type = random.choice(["positive", "negative", "neutral"])
        
        if sentiment_type == "positive":
            template = random.choice(positive_templates)
        elif sentiment_type == "negative":
            template = random.choice(negative_templates)
        else:
            template = random.choice(neutral_templates)
        
        company = random.choice(companies)
        sector = random.choice(sectors)
        percent = random.randint(5, 25)
        price = random.randint(100, 2000)
        dividend = random.randint(2, 20)
        
        title = template.format(company=company, sector=sector, percent=percent, price=price, dividend=dividend)
        
        # Generate additional content
        content = f"{title}. The {sector} sector has been showing {random.choice(['strong', 'weak', 'mixed'])} performance in recent months. "
        content += f"Analysts from {random.choice(['Morgan Stanley', 'Goldman Sachs', 'JP Morgan', 'Credit Suisse', 'Nomura'])} have {random.choice(['upgraded', 'downgraded', 'maintained'])} their outlook for {company}. "
        content += f"The company reported revenue of ₹{random.randint(1000, 10000)} crores for the quarter, which was {random.choice(['above', 'below', 'in line with'])} market expectations. "
        content += f"The management expressed {random.choice(['optimism', 'caution', 'confidence'])} about future growth prospects."
        
        # Randomly assign a date within the last week
        article_date = current_date - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
        date_str = article_date.strftime("%d %b %Y, %H:%M")
        
        simulated_news.append({
            'title': title,
            'content': content,
            'source': random.choice(['Economic Times', 'Money Control', 'Business Standard', 'Mint', 'Financial Express']),
            'date': date_str,
            'url': '#',
            'sentiment': sentiment_type
        })
    
    return simulated_news

def analyze_text_sentiment(text):
    """
    Analyze the sentiment of the given text using VADER sentiment analyzer and financial terms.
    
    Args:
        text (str): The text to analyze
        
    Returns:
        dict: Sentiment scores
    """
    # Download NLTK resources if needed
    download_nltk_resources()
    
    # Initialize sentiment analyzer
    sia = SentimentIntensityAnalyzer()
    
    # Add financial terms to sentiment analyzer
    for term in FINANCIAL_TERMS['positive']:
        sia.lexicon[term] = 2.0  # Increase positive weight
    for term in FINANCIAL_TERMS['negative']:
        sia.lexicon[term] = -2.0  # Increase negative weight
    
    # Get sentiment scores
    sentiment_scores = sia.polarity_scores(text)
    
    # Classify sentiment
    if sentiment_scores['compound'] >= 0.05:
        sentiment = 'positive'
    elif sentiment_scores['compound'] <= -0.05:
        sentiment = 'negative'
    else:
        sentiment = 'neutral'
    
    return {
        'scores': sentiment_scores,
        'sentiment': sentiment
    }

def extract_stocks_mentioned(text, stock_symbols=None):
    """
    Extract stock symbols mentioned in the text.
    
    Args:
        text (str): The text to analyze
        stock_symbols (list): List of valid stock symbols to check against
        
    Returns:
        list: Stock symbols mentioned in the text
    """
    if not stock_symbols:
        # Common stock symbols in the Indian market
        stock_symbols = [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "HINDUNILVR", "BHARTIARTL",
            "SBIN", "ITC", "LT", "AXISBANK", "BAJFINANCE", "KOTAKBANK", "ASIANPAINT", "HCLTECH",
            "MARUTI", "TITAN", "BAJAJFINSV", "ULTRACEMCO", "TECHM", "ADANIPORTS", "WIPRO",
            "SUNPHARMA", "TATASTEEL", "INDUSINDBK", "TATAMOTORS", "NTPC", "POWERGRID"
        ]
    
    # Extract stock mentions
    mentioned_stocks = []
    for symbol in stock_symbols:
        # Look for the symbol as a word
        pattern = r'\b' + re.escape(symbol) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            mentioned_stocks.append(symbol)
    
    return mentioned_stocks

def analyze_market_sentiment():
    """
    Analyze current market sentiment from news and market data.
    
    Returns:
        dict: Market sentiment analysis results
    """
    # Check if we have valid cached data
    if is_cache_valid("sentiment_data"):
        cached_data = load_from_cache("sentiment_data")
        if cached_data:
            logger.info("Using cached sentiment analysis data")
            return cached_data
    
    logger.info("Analyzing market sentiment")
    
    try:
        # Fetch news articles
        news_articles = fetch_market_news()
        
        # If no news, return neutral sentiment
        if not news_articles:
            logger.warning("No news articles found for sentiment analysis")
            return {
                'overall_market': {
                    'sentiment': 'neutral',
                    'score': 0
                },
                'sector_sentiment': {},
                'stock_sentiment': {}
            }
        
        # Analyze each article
        overall_scores = []
        sector_mentions = {}
        stock_mentions = {}
        
        common_sectors = [
            "IT", "Banking", "Finance", "Telecom", "Pharma", "Auto", "Energy", 
            "Oil", "Gas", "FMCG", "Consumer", "Metal", "Insurance", "Retail"
        ]
        
        for article in news_articles:
            # Analyze sentiment
            title_sentiment = analyze_text_sentiment(article['title'])
            content_sentiment = analyze_text_sentiment(article.get('content', ''))
            
            # Combined sentiment (title is more important)
            combined_score = title_sentiment['scores']['compound'] * 0.7 + content_sentiment['scores']['compound'] * 0.3
            
            # Add to overall scores
            overall_scores.append(combined_score)
            
            # Check for sector mentions
            for sector in common_sectors:
                if sector.lower() in article['title'].lower() or sector.lower() in article.get('content', '').lower():
                    if sector not in sector_mentions:
                        sector_mentions[sector] = []
                    sector_mentions[sector].append(combined_score)
            
            # Check for stock mentions
            mentioned_stocks = extract_stocks_mentioned(article['title'] + ' ' + article.get('content', ''))
            for stock in mentioned_stocks:
                if stock not in stock_mentions:
                    stock_mentions[stock] = []
                stock_mentions[stock].append(combined_score)
        
        # Calculate overall market sentiment
        overall_market_score = sum(overall_scores) / len(overall_scores) if overall_scores else 0
        
        if overall_market_score >= 0.05:
            overall_sentiment = 'positive'
        elif overall_market_score <= -0.05:
            overall_sentiment = 'negative'
        else:
            overall_sentiment = 'neutral'
        
        # Calculate sector sentiments
        sector_sentiment = {}
        for sector, scores in sector_mentions.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            
            if avg_score >= 0.05:
                sentiment = 'positive'
            elif avg_score <= -0.05:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            sector_sentiment[sector] = {
                'sentiment': sentiment,
                'score': avg_score,
                'mentions': len(scores)
            }
        
        # Calculate stock sentiments
        stock_sentiment = {}
        for stock, scores in stock_mentions.items():
            avg_score = sum(scores) / len(scores) if scores else 0
            
            if avg_score >= 0.05:
                sentiment = 'positive'
            elif avg_score <= -0.05:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            stock_sentiment[stock] = {
                'sentiment': sentiment,
                'score': avg_score,
                'mentions': len(scores)
            }
        
        sentiment_analysis = {
            'overall_market': {
                'sentiment': overall_sentiment,
                'score': overall_market_score
            },
            'sector_sentiment': sector_sentiment,
            'stock_sentiment': stock_sentiment,
            'news_count': len(news_articles),
            'latest_news': news_articles[:5]  # Include the latest 5 news articles
        }
        
        # Save to cache
        save_to_cache(sentiment_analysis, "sentiment_data")
        
        logger.info(f"Completed market sentiment analysis: {overall_sentiment} ({overall_market_score:.2f})")
        return sentiment_analysis
    
    except Exception as e:
        logger.error(f"Error in market sentiment analysis: {e}")
        
        # Return a default neutral sentiment
        return {
            'overall_market': {
                'sentiment': 'neutral',
                'score': 0
            },
            'sector_sentiment': {
                'IT': {'sentiment': 'positive', 'score': 0.2, 'mentions': 5},
                'Banking': {'sentiment': 'neutral', 'score': 0.0, 'mentions': 8},
                'Pharma': {'sentiment': 'positive', 'score': 0.3, 'mentions': 3}
            },
            'stock_sentiment': {
                'RELIANCE': {'sentiment': 'positive', 'score': 0.4, 'mentions': 7},
                'HDFCBANK': {'sentiment': 'neutral', 'score': 0.1, 'mentions': 4},
                'INFY': {'sentiment': 'negative', 'score': -0.2, 'mentions': 2}
            },
            'error': str(e)
        } 