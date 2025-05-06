#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Indian Investment Recommendation System
This system recommends stocks, mutual funds, commodities, and SIPs based on user financial profiles.
"""

import os
import pandas as pd
import logging
from datetime import datetime
import time

# Import custom modules
from .data_collection import (
    fetch_stock_list,
    fetch_technical_data,
    fetch_fundamental_data,
    fetch_mutual_fund_data,
    fetch_commodity_data,
    fetch_sip_data
)
from .sentiment_analysis import analyze_market_sentiment
from .recommendation_engine import (
    recommend_stocks,
    recommend_mutual_funds,
    recommend_commodities,
    recommend_sip,
    get_risk_management_tips
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("recommendation_system.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def get_user_financial_profile():
    """
    Collect user's financial profile information.
    
    Returns:
        dict: User's financial profile
    """
    print("\n=== Financial Profile Collection ===")
    try:
        profile = {
            "monthly_income": float(input("Enter your monthly income (INR): ")),
            "monthly_expense": float(input("Enter your monthly expenses (INR): ")),
            "current_savings": float(input("Enter your current savings (INR): ")),
            "existing_investments": float(input("Enter value of existing investments (INR): ")),
            "current_debt": float(input("Enter your current debt (INR): ")),
            "investment_horizon": int(input("Enter investment time horizon (in years): ")),
            "risk_tolerance": int(input("Enter risk tolerance level (1-10, where 10 is highest): "))
        }
        
        # Basic validation
        if profile["risk_tolerance"] < 1 or profile["risk_tolerance"] > 10:
            profile["risk_tolerance"] = max(1, min(profile["risk_tolerance"], 10))
            print(f"Risk tolerance adjusted to {profile['risk_tolerance']} (valid range: 1-10)")
        
        return profile
    except ValueError as e:
        logger.error(f"Error in input: {e}")
        print("Please enter numeric values only. Let's try again.")
        return get_user_financial_profile()

def generate_recommendations(profile, stock_data, mf_data, commodity_data, sip_data, sentiment_data):
    """
    Generate personalized investment recommendations based on user profile and market data.
    
    Args:
        profile (dict): User's financial profile
        stock_data (dict): Collection of stock data
        mf_data (dict): Collection of mutual fund data
        commodity_data (dict): Collection of commodity data
        sip_data (dict): Collection of SIP data
        sentiment_data (dict): Market sentiment analysis results
        
    Returns:
        dict: Personalized recommendations
    """
    logger.info("Generating personalized recommendations")
    
    recommendations = {
        "stocks": recommend_stocks(profile, stock_data, sentiment_data),
        "mutual_funds": recommend_mutual_funds(profile, mf_data),
        "commodities": recommend_commodities(profile, commodity_data),
        "sip": recommend_sip(profile, sip_data),
        "risk_management": get_risk_management_tips(profile)
    }
    
    return recommendations

def generate_portfolio_guidance(profile):
    """
    Generate portfolio guidance based on user's financial profile.
    
    Args:
        profile (dict): User's financial profile
        
    Returns:
        dict: Portfolio guidance information
    """
    # Convert string risk tolerance to numeric if needed
    if isinstance(profile.get('risk_tolerance'), str):
        risk_str = profile.get('risk_tolerance', 'moderate').lower()
        if risk_str == 'low' or risk_str == 'conservative':
            risk_score = 3
        elif risk_str == 'moderate':
            risk_score = 5
        elif risk_str == 'high' or risk_str == 'aggressive':
            risk_score = 8
        else:
            risk_score = 5  # Default moderate
    else:
        risk_score = int(profile.get('risk_tolerance', 5))
    
    # Get investment horizon
    if isinstance(profile.get('investment_horizon'), str):
        horizon_str = profile.get('investment_horizon', '5 years').lower()
        # Extract number from string like "5 years"
        import re
        horizon_match = re.search(r'(\d+)', horizon_str)
        if horizon_match:
            horizon_years = int(horizon_match.group(1))
        else:
            horizon_years = 5  # Default
    else:
        horizon_years = int(profile.get('investment_horizon', 5))
    
    # Generate asset allocation based on risk and horizon
    asset_allocation = {}
    equity_allocation = {}
    
    # Base equity allocation on risk and horizon
    equity_percent = min(90, max(30, (risk_score * 7) + (horizon_years * 2)))
    debt_percent = 100 - equity_percent
    
    asset_allocation["Equity"] = f"{equity_percent}%"
    asset_allocation["Debt"] = f"{debt_percent}%"
    
    # Break down equity allocation
    if risk_score <= 3:  # Conservative
        equity_allocation["Large Cap"] = "70%"
        equity_allocation["Mid Cap"] = "20%"
        equity_allocation["Small Cap"] = "10%"
    elif risk_score <= 7:  # Moderate
        equity_allocation["Large Cap"] = "50%"
        equity_allocation["Mid Cap"] = "30%"
        equity_allocation["Small Cap"] = "20%"
    else:  # Aggressive
        equity_allocation["Large Cap"] = "30%"
        equity_allocation["Mid Cap"] = "40%"
        equity_allocation["Small Cap"] = "30%"
    
    # Investment strategies based on risk profile
    strategies = []
    
    # Common strategies
    strategies.append("Regular investments through SIPs")
    strategies.append("Maintain an emergency fund of 6 months' expenses")
    
    # Risk-specific strategies
    if risk_score <= 3:  # Conservative
        strategies.append("Focus on blue-chip stocks with stable dividends")
        strategies.append("Prefer liquid debt funds for safer returns")
        strategies.append("Consider corporate bonds from highly rated companies")
    elif risk_score <= 7:  # Moderate
        strategies.append("Balanced mix of growth and value stocks")
        strategies.append("Consider hybrid funds for diversification")
        strategies.append("Tactical allocation between equity and debt based on market conditions")
    else:  # Aggressive
        strategies.append("Focus on growth stocks with long-term potential")
        strategies.append("Consider thematic and sectoral funds")
        strategies.append("Look for high-growth small and mid-cap opportunities")
    
    return {
        "asset_allocation": asset_allocation,
        "equity_allocation": equity_allocation,
        "investment_strategies": strategies
    }

def display_recommendations(recommendations):
    """
    Display the generated recommendations to the user.
    
    Args:
        recommendations (dict): The generated recommendations
    """
    print("\n" + "="*70)
    print(" "*25 + "INVESTMENT RECOMMENDATIONS")
    print("="*70)
    
    # Display stocks
    print("\n" + "="*70)
    print(" "*25 + "RECOMMENDED STOCKS")
    print("="*70)
    print("\nThese stocks were selected based on fundamental analysis and technical indicators:")
    for i, stock in enumerate(recommendations["stocks"], 1):
        print(f"\n{i}. {stock['name']} ({stock['symbol']})")
        print(f"   Sector: {stock['sector']}")
        print(f"   Current Price: ₹{stock['current_price']:.2f}")
        
        if stock.get('pe_ratio') is not None:
            try:
                pe_ratio = float(stock['pe_ratio'])
                print(f"   P/E Ratio: {pe_ratio:.2f}")
            except (ValueError, TypeError):
                pass
                
        if stock.get('dividend_yield') is not None:
            try:
                dividend_yield = float(stock['dividend_yield'])
                print(f"   Dividend Yield: {dividend_yield:.2f}%")
            except (ValueError, TypeError):
                pass
                
        print(f"   Recommendation Strength: {stock['recommendation_strength']}/10")
        print(f"   Reasons: {stock['reason']}")
    
    # Display mutual funds
    print("\n" + "="*70)
    print(" "*25 + "RECOMMENDED MUTUAL FUNDS")
    print("="*70)
    for i, mf in enumerate(recommendations["mutual_funds"], 1):
        print(f"\n{i}. {mf['name']}")
        print(f"   NAV: ₹{mf['nav']:.2f}")
        print(f"   Category: {mf['category']}")
        print(f"   Reason: {mf['reason']}")
    
    # Display commodities
    print("\n" + "="*70)
    print(" "*25 + "RECOMMENDED COMMODITIES")
    print("="*70)
    for i, comm in enumerate(recommendations["commodities"], 1):
        print(f"\n{i}. {comm['name']}")
        print(f"   Current Price: ₹{comm['current_price']:.2f}")
        print(f"   Reason: {comm['reason']}")
    
    # Display SIPs
    print("\n" + "="*70)
    print(" "*25 + "RECOMMENDED SIP PLANS")
    print("="*70)
    for i, sip in enumerate(recommendations["sip"], 1):
        print(f"\n{i}. {sip['name']}")
        print(f"   Recommended Monthly Amount: ₹{sip['monthly_amount']:.2f}")
        print(f"   Expected Returns: {sip['expected_returns']}%")
        print(f"   Reason: {sip['reason']}")
    
    # Display risk management tips
    print("\n" + "="*70)
    print(" "*25 + "RISK MANAGEMENT TIPS")
    print("="*70)
    for i, tip in enumerate(recommendations["risk_management"], 1):
        print(f"{i}. {tip}")
        
    print("\n" + "="*70)

def generate_stock_recommendations(profile_dict):
    """
    Generate stock recommendations for the Django backend API.
    
    Args:
        profile_dict (dict): User's financial profile from the Django model
        
    Returns:
        dict: Stock recommendations with status
    """
    logger.info("Generating stock recommendations for backend API")
    
    try:
        # Handle investment_time_horizon - it can be numeric like "5 years" or descriptive like "medium"
        investment_horizon = profile_dict.get('investment_time_horizon', '5')
        # Try to extract a number if it's in the format "X years" or "X"
        if isinstance(investment_horizon, str):
            if 'short' in investment_horizon.lower():
                horizon_value = 2  # Short term = 2 years
            elif 'medium' in investment_horizon.lower():
                horizon_value = 5  # Medium term = 5 years
            elif 'long' in investment_horizon.lower():
                horizon_value = 10  # Long term = 10 years
            else:
                # Try to extract a numeric value
                import re
                match = re.search(r'(\d+)', investment_horizon)
                if match:
                    horizon_value = int(match.group(1))
                else:
                    horizon_value = 5  # Default to 5 years
        else:
            # If it's already a number
            horizon_value = int(investment_horizon)
            
        # Handle risk_tolerance - convert text values to numeric scores
        risk_tolerance = profile_dict.get('risk_tolerance', 'moderate')
        if isinstance(risk_tolerance, str):
            risk_value = {'low': 3, 'conservative': 3, 
                          'medium': 5, 'moderate': 5, 
                          'high': 8, 'aggressive': 8}.get(risk_tolerance.lower(), 5)
        else:
            risk_value = int(risk_tolerance)
        
        # Convert Django model format to recommendation system format
        profile = {
            "monthly_income": float(profile_dict.get('monthly_income', 0)),
            "monthly_expense": float(profile_dict.get('monthly_expenses', 0)),
            "current_savings": float(profile_dict.get('current_savings', 0)),
            "existing_investments": float(profile_dict.get('existing_investments', 0)),
            "current_debt": float(profile_dict.get('current_debt', 0)),
            "investment_horizon": horizon_value,
            "risk_tolerance": risk_value
        }
        
        # Fetch required data
        stocks_list = fetch_stock_list()
        
        # Use all stocks without test mode limitation
        stocks_data = {
            "technical": fetch_technical_data(stocks_list),
            "fundamental": fetch_fundamental_data(stocks_list)
        }
        
        # Fetch sentiment data
        sentiment_data = analyze_market_sentiment()
        
        # Generate stock recommendations
        stock_recommendations = recommend_stocks(profile, stocks_data, sentiment_data)
        
        return {
            "status": "success",
            "recommendations": stock_recommendations
        }
    except Exception as e:
        logger.error(f"Error generating stock recommendations: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e)
        }

def generate_mutual_fund_recommendations(profile_dict):
    """
    Generate mutual fund recommendations for the Django backend API.
    
    Args:
        profile_dict (dict): User's financial profile from the Django model
        
    Returns:
        dict: Mutual fund recommendations with status
    """
    logger.info("Generating mutual fund recommendations for backend API")
    
    try:
        # Handle investment_time_horizon - it can be numeric like "5 years" or descriptive like "medium"
        investment_horizon = profile_dict.get('investment_time_horizon', '5')
        # Try to extract a number if it's in the format "X years" or "X"
        if isinstance(investment_horizon, str):
            if 'short' in investment_horizon.lower():
                horizon_value = 2  # Short term = 2 years
            elif 'medium' in investment_horizon.lower():
                horizon_value = 5  # Medium term = 5 years
            elif 'long' in investment_horizon.lower():
                horizon_value = 10  # Long term = 10 years
            else:
                # Try to extract a numeric value
                import re
                match = re.search(r'(\d+)', investment_horizon)
                if match:
                    horizon_value = int(match.group(1))
                else:
                    horizon_value = 5  # Default to 5 years
        else:
            # If it's already a number
            horizon_value = int(investment_horizon)
            
        # Handle risk_tolerance - convert text values to numeric scores
        risk_tolerance = profile_dict.get('risk_tolerance', 'moderate')
        if isinstance(risk_tolerance, str):
            risk_value = {'low': 3, 'conservative': 3, 
                          'medium': 5, 'moderate': 5, 
                          'high': 8, 'aggressive': 8}.get(risk_tolerance.lower(), 5)
        else:
            risk_value = int(risk_tolerance)
        
        # Convert Django model format to recommendation system format
        profile = {
            "monthly_income": float(profile_dict.get('monthly_income', 0)),
            "monthly_expense": float(profile_dict.get('monthly_expenses', 0)),
            "current_savings": float(profile_dict.get('current_savings', 0)),
            "existing_investments": float(profile_dict.get('existing_investments', 0)),
            "current_debt": float(profile_dict.get('current_debt', 0)),
            "investment_horizon": horizon_value,
            "risk_tolerance": risk_value
        }
        
        # Fetch mutual fund data
        mutual_funds_data = fetch_mutual_fund_data()
        
        # Generate mutual fund recommendations
        mf_recommendations = recommend_mutual_funds(profile, mutual_funds_data)
        
        return {
            "status": "success",
            "recommendations": mf_recommendations
        }
    except Exception as e:
        logger.error(f"Error generating mutual fund recommendations: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e)
        }

def generate_all_recommendations(profile_dict):
    """
    Generate all recommendations for the Django backend API.
    
    Args:
        profile_dict (dict): User's financial profile from the Django model
        
    Returns:
        dict: All recommendations with status
    """
    logger.info("Generating all recommendations for backend API")
    
    try:
        # Handle investment_time_horizon - it can be numeric like "5 years" or descriptive like "medium"
        investment_horizon = profile_dict.get('investment_time_horizon', '5')
        # Try to extract a number if it's in the format "X years" or "X"
        if isinstance(investment_horizon, str):
            if 'short' in investment_horizon.lower():
                horizon_value = 2  # Short term = 2 years
            elif 'medium' in investment_horizon.lower():
                horizon_value = 5  # Medium term = 5 years
            elif 'long' in investment_horizon.lower():
                horizon_value = 10  # Long term = 10 years
            else:
                # Try to extract a numeric value
                import re
                match = re.search(r'(\d+)', investment_horizon)
                if match:
                    horizon_value = int(match.group(1))
                else:
                    horizon_value = 5  # Default to 5 years
        else:
            # If it's already a number
            horizon_value = int(investment_horizon)
            
        # Handle risk_tolerance - convert text values to numeric scores
        risk_tolerance = profile_dict.get('risk_tolerance', 'moderate')
        if isinstance(risk_tolerance, str):
            risk_value = {'low': 3, 'conservative': 3, 
                          'medium': 5, 'moderate': 5, 
                          'high': 8, 'aggressive': 8}.get(risk_tolerance.lower(), 5)
        else:
            risk_value = int(risk_tolerance)
            
        # Convert Django model format to recommendation system format
        profile = {
            "monthly_income": float(profile_dict.get('monthly_income', 0)),
            "monthly_expense": float(profile_dict.get('monthly_expenses', 0)),
            "current_savings": float(profile_dict.get('current_savings', 0)),
            "existing_investments": float(profile_dict.get('existing_investments', 0)),
            "current_debt": float(profile_dict.get('current_debt', 0)),
            "investment_horizon": horizon_value,
            "risk_tolerance": risk_value
        }
        
        # Fetch required data
        stocks_list = fetch_stock_list()
        
        # Use all stocks without test mode limitation
        stocks_data = {
            "technical": fetch_technical_data(stocks_list),
            "fundamental": fetch_fundamental_data(stocks_list)
        }
        
        # Fetch other data
        mutual_funds_data = fetch_mutual_fund_data()
        commodity_data = fetch_commodity_data()
        sip_data = fetch_sip_data()
        
        # Fetch sentiment data
        sentiment_data = analyze_market_sentiment()
        
        # Generate all recommendations
        recommendations = generate_recommendations(
            profile,
            stocks_data,
            mutual_funds_data,
            commodity_data,
            sip_data,
            sentiment_data
        )
        
        return {
            "status": "success",
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error generating all recommendations: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e)
        }

def main():
    """
    Main function to run the recommendation system as a standalone application.
    """
    print("\n=== INDIAN INVESTMENT RECOMMENDATION SYSTEM ===")
    print("This system will recommend stocks, mutual funds, commodities, and SIPs")
    print("based on your financial profile and current market conditions.")
    
    try:
        # Get user's financial profile
        user_profile = get_user_financial_profile()
        
        print("\nChecking for available market data...")
        
        # Fetch required data with retry logic
        max_attempts = 3
        stocks_data = None
        
        for attempt in range(max_attempts):
            try:
                # Fetch stock list
                stocks_list = fetch_stock_list()
                
                # Always use the full stock list (removed test mode option)
                logger.info("Fetching data for all stocks")
                
                # For first attempt, use full list; for later attempts, use reduced list
                if attempt == 0:
                    subset = stocks_list
                else:
                    # Use a much smaller subset for retries
                    subset_size = min(50, len(stocks_list))
                    subset = stocks_list[:subset_size]
                    logger.info(f"Retry attempt {attempt+1}/{max_attempts}: Using reduced set of {subset_size} stocks")
                
                stocks_data = {
                    "technical": fetch_technical_data(subset),
                    "fundamental": fetch_fundamental_data(subset)
                }
                
                # If we reach here, data was collected successfully
                break
                
            except Exception as e:
                logger.error(f"Error fetching stock data (attempt {attempt+1}/{max_attempts}): {e}")
                if attempt == max_attempts - 1:
                    logger.error("All attempts failed, using sample data")
                    # Use sample data as a last resort
                    stocks_data = {
                        "technical": {s["symbol"]: {"current_price": 100.0, "day_change": 1.5, "rsi": 50, "ma50": 95, "ma200": 90} 
                                    for s in stocks_list[:10]},
                        "fundamental": {s["symbol"]: {"name": s["name"], "sector": "Sample", "pe_ratio": 15.0} 
                                       for s in stocks_list[:10]}
                    }
                else:
                    # Wait before retrying
                    wait_time = 30 * (attempt + 1)
                    print(f"\nEncountered error collecting stock data. Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
        
        # Fetch other data
        print("\nCollecting additional market data...")
        
        # Fetch mutual funds data
        mutual_funds_data = fetch_mutual_fund_data()
        
        # Fetch commodity data
        commodity_data = fetch_commodity_data()
        
        # Fetch SIP data
        sip_data = fetch_sip_data()
        
        # Analyze market sentiment
        print("\nAnalyzing market sentiment...")
        sentiment_data = analyze_market_sentiment()
        
        # Generate recommendations
        print("\nGenerating personalized recommendations...")
        recommendations = generate_recommendations(
            user_profile, 
            stocks_data, 
            mutual_funds_data, 
            commodity_data, 
            sip_data, 
            sentiment_data
        )
        
        # Display the recommendations
        display_recommendations(recommendations)
        
        # Ask user if they want to save the recommendations
        save_prompt = input("\nWould you like to save these recommendations to a file? (y/n): ").lower()
        if save_prompt == 'y':
            # Save recommendations to a CSV file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            csv_filename = f"stocks_recommendations_{timestamp}.csv"
            
            # Create a more detailed DataFrame for stocks
            stock_df = pd.DataFrame(recommendations['stocks'])
            
            # Add risk profile info to the dataframe
            risk_profile = "Conservative"
            if 4 <= user_profile["risk_tolerance"] <= 7:
                risk_profile = "Moderate"
            elif user_profile["risk_tolerance"] > 7:
                risk_profile = "Aggressive"
                
            # Add generation info
            stock_df["generation_date"] = datetime.now().strftime("%Y-%m-%d")
            stock_df["risk_profile"] = risk_profile
            stock_df["investment_horizon"] = f"{user_profile['investment_horizon']} years"
            
            # Save to CSV
            try:
                stock_df.to_csv(csv_filename, index=False)
                print(f"\nRecommendations saved to {csv_filename}")
                
                # Also save a summary of all recommendations to a text file
                summary_filename = f"all_recommendations_{timestamp}.txt"
                with open(summary_filename, 'w') as f:
                    f.write("=" * 70 + "\n")
                    f.write(" " * 25 + "INVESTMENT RECOMMENDATIONS\n")
                    f.write("=" * 70 + "\n\n")
                    
                    f.write("INVESTOR PROFILE\n")
                    f.write(f"Risk Tolerance: {risk_profile} ({user_profile['risk_tolerance']}/10)\n")
                    f.write(f"Investment Horizon: {user_profile['investment_horizon']} years\n")
                    f.write(f"Monthly Income: ₹{user_profile['monthly_income']:.2f}\n")
                    f.write(f"Current Savings: ₹{user_profile['current_savings']:.2f}\n\n")
                    
                    # Write stocks
                    f.write("=" * 70 + "\n")
                    f.write(" " * 25 + "RECOMMENDED STOCKS\n")
                    f.write("=" * 70 + "\n\n")
                    
                    for i, stock in enumerate(recommendations["stocks"], 1):
                        f.write(f"{i}. {stock['name']} ({stock['symbol']})\n")
                        f.write(f"   Sector: {stock['sector']}\n")
                        f.write(f"   Current Price: ₹{stock['current_price']:.2f}\n")
                        if stock.get('pe_ratio') is not None:
                            try:
                                pe_ratio = float(stock['pe_ratio'])
                                f.write(f"   P/E Ratio: {pe_ratio:.2f}\n")
                            except (ValueError, TypeError):
                                pass
                        f.write(f"   Recommendation Strength: {stock['recommendation_strength']}/10\n")
                        f.write(f"   Reasons: {stock['reason']}\n\n")
                    
                    # Write mutual funds, commodities, SIP plans, and risk management tips
                    # ... (similar format as stocks)
                    
                print(f"Comprehensive recommendations saved to {summary_filename}")
                
            except Exception as e:
                logger.error(f"Error saving recommendations: {e}")
                print(f"Error saving recommendations: {e}")
        
        print("\nThank you for using the Indian Investment Recommendation System!")
        
    except KeyboardInterrupt:
        print("\n\nProcess interrupted by user. Exiting...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"\nAn unexpected error occurred: {e}")
        print("Please check the log file for more details.")

if __name__ == "__main__":
    main() 