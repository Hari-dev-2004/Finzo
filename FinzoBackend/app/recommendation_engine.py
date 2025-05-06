#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Recommendation Engine for Indian Investment Recommendation System.
This module analyzes user financial profiles and market data to make personalized investment recommendations.
"""

import logging
import pandas as pd
import numpy as np
from datetime import datetime
import random

# Set up logging
logger = logging.getLogger(__name__)

def calculate_investment_capacity(profile):
    """
    Calculate how much a user can invest based on their financial profile.
    
    Args:
        profile (dict): User's financial profile
        
    Returns:
        dict: Investment capacity details
    """
    monthly_income = profile["monthly_income"]
    monthly_expense = profile["monthly_expense"]
    current_savings = profile["current_savings"]
    existing_investments = profile["existing_investments"]
    current_debt = profile["current_debt"]
    
    # Calculate monthly surplus
    monthly_surplus = monthly_income - monthly_expense
    
    # Calculate debt to income ratio
    debt_to_income_ratio = current_debt / monthly_income if monthly_income > 0 else float('inf')
    
    # Calculate total net worth
    net_worth = current_savings + existing_investments - current_debt
    
    # Calculate emergency fund requirement (6 months of expenses)
    emergency_fund_requirement = monthly_expense * 6
    
    # Calculate available for investment
    current_savings_surplus = max(0, current_savings - emergency_fund_requirement)
    
    # Calculate recommended monthly investment
    if debt_to_income_ratio > 0.5:
        # Focus on debt reduction first
        recommended_monthly_investment = monthly_surplus * 0.3
        debt_payment_recommendation = monthly_surplus * 0.7
    else:
        recommended_monthly_investment = monthly_surplus * 0.7
        debt_payment_recommendation = monthly_surplus * 0.3
    
    # Calculate lump sum investment capacity
    lump_sum_investment_capacity = current_savings_surplus * 0.8  # Keep some buffer
    
    # Ensure non-negative values
    recommended_monthly_investment = max(0, recommended_monthly_investment)
    lump_sum_investment_capacity = max(0, lump_sum_investment_capacity)
    debt_payment_recommendation = max(0, debt_payment_recommendation)
    
    return {
        "monthly_surplus": monthly_surplus,
        "debt_to_income_ratio": debt_to_income_ratio,
        "net_worth": net_worth,
        "emergency_fund_requirement": emergency_fund_requirement,
        "current_savings_surplus": current_savings_surplus,
        "recommended_monthly_investment": recommended_monthly_investment,
        "lump_sum_investment_capacity": lump_sum_investment_capacity,
        "debt_payment_recommendation": debt_payment_recommendation
    }

def determine_asset_allocation(profile):
    """
    Determine the ideal asset allocation based on user's risk tolerance and investment horizon.
    
    Args:
        profile (dict): User's financial profile
        
    Returns:
        dict: Recommended asset allocation
    """
    risk_tolerance = profile["risk_tolerance"]  # 1-10
    investment_horizon = profile["investment_horizon"]  # in years
    
    # Base allocations adjusted by risk tolerance and investment horizon
    # Higher risk tolerance and longer horizon = higher equity allocation
    
    # Calculate base equity allocation
    equity_base = min(30 + (risk_tolerance * 5), 90)
    
    # Adjust for investment horizon
    horizon_factor = min(investment_horizon / 2, 5)  # Cap at 5 years
    equity_allocation = min(equity_base + (horizon_factor * 2), 90)
    
    # Calculate debt allocation
    debt_allocation = 100 - equity_allocation - 5  # Leaving 5% for gold/commodities
    
    # Adjust for very short term horizons
    if investment_horizon < 3:
        equity_allocation = max(equity_allocation * 0.7, 20)
        debt_allocation = 100 - equity_allocation - 5
    
    # Minimum 5% for gold/commodities
    commodity_allocation = 5
    
    # Ensure allocations sum to 100%
    total = equity_allocation + debt_allocation + commodity_allocation
    equity_allocation = (equity_allocation / total) * 100
    debt_allocation = (debt_allocation / total) * 100
    commodity_allocation = (commodity_allocation / total) * 100
    
    # Further break down equity allocation
    large_cap_allocation = equity_allocation * (0.7 - (risk_tolerance / 30))
    mid_cap_allocation = equity_allocation * (0.2 + (risk_tolerance / 60))
    small_cap_allocation = equity_allocation * (0.1 + (risk_tolerance / 60))
    
    # Break down debt allocation
    govt_bonds_allocation = debt_allocation * 0.4
    corporate_bonds_allocation = debt_allocation * 0.6
    
    return {
        "equity": round(equity_allocation, 2),
        "equity_breakdown": {
            "large_cap": round(large_cap_allocation, 2),
            "mid_cap": round(mid_cap_allocation, 2),
            "small_cap": round(small_cap_allocation, 2)
        },
        "debt": round(debt_allocation, 2),
        "debt_breakdown": {
            "govt_bonds": round(govt_bonds_allocation, 2),
            "corporate_bonds": round(corporate_bonds_allocation, 2)
        },
        "commodities": round(commodity_allocation, 2)
    }

def recommend_stocks(profile, stock_data, sentiment_data):
    """
    Recommend stocks based on user profile, technical/fundamental data, and market sentiment.
    First filter by fundamental data, then apply technical indicators to find best 7-8 stocks.
    
    Args:
        profile (dict): User's financial profile
        stock_data (dict): Technical and fundamental stock data
        sentiment_data (dict): Market sentiment analysis
        
    Returns:
        list: Recommended stocks with reasoning
    """
    logger.info("Generating stock recommendations")
    
    # Combine technical and fundamental data
    technical_data = stock_data.get("technical", {})
    fundamental_data = stock_data.get("fundamental", {})
    
    # Get stock sentiment
    stock_sentiment = sentiment_data.get("stock_sentiment", {})
    sector_sentiment = sentiment_data.get("sector_sentiment", {})
    
    # Filter stocks based on data availability
    valid_stocks = [symbol for symbol in technical_data.keys() if symbol in fundamental_data]
    
    if not valid_stocks:
        logger.warning("No valid stocks with complete data found")
        return []
    
    # Step 1: First filter and score based on fundamental data
    fundamental_scores = {}
    
    for symbol in valid_stocks:
        fund = fundamental_data.get(symbol, {})
        
        if not fund:
            continue
        
        score = 0
        fundamental_reasons = []
        
        # Analyze fundamental metrics
        try:
            # PE ratio analysis
            if fund.get("pe_ratio") is not None and fund.get("pe_ratio") != "":
                try:
                    pe_ratio = float(fund["pe_ratio"])
                    # Prefer reasonable PE ratios
                    if 5 < pe_ratio < 20:  # More favorable PE range
                        score += 4  # Increased weight
                        fundamental_reasons.append(f"Attractive P/E ratio of {pe_ratio:.2f}")
                    elif 20 <= pe_ratio < 30:
                        score += 2  # Increased weight
                        fundamental_reasons.append(f"Reasonable P/E ratio of {pe_ratio:.2f}")
                    elif 30 <= pe_ratio < 40:
                        score += 1
                        fundamental_reasons.append(f"P/E ratio of {pe_ratio:.2f}")
                except (ValueError, TypeError):
                    pass

            # Industry PE comparison if available
            if fund.get("pe_ratio") is not None and fund.get("industry_pe") is not None:
                try:
                    pe_ratio = float(fund["pe_ratio"])
                    industry_pe = float(fund["industry_pe"])
                    if pe_ratio < industry_pe * 0.8:  # PE is 20% below industry average
                        score += 4
                        fundamental_reasons.append(f"P/E ratio significantly below industry average ({pe_ratio:.2f} vs {industry_pe:.2f})")
                    elif pe_ratio < industry_pe:
                        score += 2
                        fundamental_reasons.append(f"P/E ratio below industry average ({pe_ratio:.2f} vs {industry_pe:.2f})")
                except (ValueError, TypeError):
                    pass
                    
            # Return on Equity (ROE)
            if fund.get("roe") is not None and fund.get("roe") != "":
                try:
                    roe = float(fund["roe"])
                    if roe > 20:
                        score += 5  # Increased weight
                        fundamental_reasons.append(f"Excellent ROE of {roe:.2f}%")
                    elif roe > 15:
                        score += 4  # Increased weight
                        fundamental_reasons.append(f"Strong ROE of {roe:.2f}%")
                    elif roe > 10:
                        score += 3  # Increased weight
                        fundamental_reasons.append(f"Good ROE of {roe:.2f}%")
                    elif roe > 5:  # Added more tier
                        score += 1
                        fundamental_reasons.append(f"Positive ROE of {roe:.2f}%")
                except (ValueError, TypeError):
                    pass
            
            # Debt to Equity
            if fund.get("debt_to_equity") is not None and fund.get("debt_to_equity") != "":
                try:
                    debt_to_equity = float(fund["debt_to_equity"])
                    if debt_to_equity < 0.3:  # Added more favorable tier
                        score += 4  # Increased weight
                        fundamental_reasons.append(f"Exceptionally low debt-to-equity ratio of {debt_to_equity:.2f}")
                    elif debt_to_equity < 0.6:
                        score += 3  # Increased weight
                        fundamental_reasons.append(f"Very low debt-to-equity ratio of {debt_to_equity:.2f}")
                    elif debt_to_equity < 1:
                        score += 2
                        fundamental_reasons.append(f"Good debt-to-equity ratio of {debt_to_equity:.2f}")
                    elif debt_to_equity < 1.5:  # Added more tier
                        score += 1
                        fundamental_reasons.append(f"Reasonable debt-to-equity ratio of {debt_to_equity:.2f}")
                except (ValueError, TypeError):
                    pass
            
            # EPS analysis
            if fund.get("eps") is not None and fund.get("eps") != "":
                try:
                    eps = float(fund["eps"])
                    if eps > 50:
                        score += 4  # Increased weight
                        fundamental_reasons.append(f"High EPS of ₹{eps:.2f}")
                    elif eps > 20:
                        score += 3  # Increased weight
                        fundamental_reasons.append(f"Good EPS of ₹{eps:.2f}")
                    elif eps > 10:  # Added more tier
                        score += 2
                        fundamental_reasons.append(f"Positive EPS of ₹{eps:.2f}")
                except (ValueError, TypeError):
                    pass
                    
            # Dividend Yield
            if fund.get("dividend_yield") is not None and fund.get("dividend_yield") != "":
                try:
                    div_yield = float(fund["dividend_yield"])
                    if div_yield > 4:
                        score += 3
                        fundamental_reasons.append(f"Excellent dividend yield of {div_yield:.2f}%")
                    elif div_yield > 2:
                        score += 2
                        fundamental_reasons.append(f"Good dividend yield of {div_yield:.2f}%")
                    elif div_yield > 1:
                        score += 1
                        fundamental_reasons.append(f"Positive dividend yield of {div_yield:.2f}%")
                except (ValueError, TypeError):
                    pass
                    
            # Profit Growth
            if fund.get("profit_growth") is not None and fund.get("profit_growth") != "":
                try:
                    profit_growth = float(fund["profit_growth"])
                    if profit_growth > 30:
                        score += 5
                        fundamental_reasons.append(f"Exceptional profit growth of {profit_growth:.2f}%")
                    elif profit_growth > 20:
                        score += 4
                        fundamental_reasons.append(f"Strong profit growth of {profit_growth:.2f}%")
                    elif profit_growth > 10:
                        score += 3
                        fundamental_reasons.append(f"Good profit growth of {profit_growth:.2f}%")
                    elif profit_growth > 5:
                        score += 1
                        fundamental_reasons.append(f"Positive profit growth of {profit_growth:.2f}%")
                except (ValueError, TypeError):
                    pass
                    
            # Market Cap - categorize by size
            market_cap_category = "Unknown"
            if fund.get("market_cap") is not None and fund.get("market_cap") != "":
                try:
                    market_cap = float(fund["market_cap"])
                    market_cap_crores = market_cap / 10000000  # Convert to crores
                    risk_tolerance = int(profile["risk_tolerance"])
                    
                    if market_cap_crores > 50000:
                        market_cap_category = "Large Cap"
                        # Add score based on risk preference
                        if risk_tolerance <= 4:  # Conservative investors prefer large caps
                            score += 3
                            fundamental_reasons.append(f"Large cap stock aligns with your lower risk profile")
                    elif market_cap_crores > 5000:
                        market_cap_category = "Mid Cap"
                        # Add score based on risk preference
                        if 4 < risk_tolerance < 8:  # Moderate investors prefer mid caps
                            score += 3
                            fundamental_reasons.append(f"Mid cap stock aligns with your moderate risk profile")
                    else:
                        market_cap_category = "Small Cap"
                        # Add score based on risk preference
                        if risk_tolerance >= 7:  # Aggressive investors prefer small caps
                            score += 3
                            fundamental_reasons.append(f"Small cap stock aligns with your higher risk profile")
                except (ValueError, TypeError):
                    pass
                    
            # Sector evaluation
            sector = fund.get("sector", "Unknown")
            
            # Look for sector in sentiment data
            if sector in sector_sentiment:
                sector_sent = sector_sentiment.get(sector, {})
                if sector_sent.get("sentiment") == "positive":
                    score += 2
                    fundamental_reasons.append(f"Positive sentiment for {sector} sector")
                elif sector_sent.get("sentiment") == "neutral":
                    score += 1
                    fundamental_reasons.append(f"Neutral sentiment for {sector} sector")
            
            # Base points for having complete fundamental data
            if all(key in fund and fund[key] is not None for key in ["pe_ratio", "roe", "debt_to_equity", "eps"]):
                score += 1
                fundamental_reasons.append("Complete fundamental analysis available")
            
            # Save the fundamental score along with reasons
            fundamental_scores[symbol] = {
                "symbol": symbol,
                "name": fund.get("name", symbol),
                "sector": sector,
                "market_cap_category": market_cap_category,
                "score": score,
                "reasons": fundamental_reasons
            }
            
        except Exception as e:
            logger.warning(f"Error processing fundamental data for {symbol}: {e}")
            continue
    
    # Sort by fundamental score (descending)
    sorted_fundamental = sorted(fundamental_scores.values(), key=lambda x: x["score"], reverse=True)
    
    # Take top 25 stocks based on fundamentals for further technical analysis
    top_fundamental_stocks = sorted_fundamental[:25]
    
    if not top_fundamental_stocks:
        logger.warning("No stocks passed the fundamental analysis filter")
        return []
    
    # Step 2: Apply technical analysis to the fundamental candidates
    stock_scores = {}
    
    for stock in top_fundamental_stocks:
        symbol = stock["symbol"]
        tech = technical_data.get(symbol, {})
        
        if not tech:
            continue
        
        # Start with the fundamental score
        score = stock["score"]
        reasons = stock["reasons"].copy()  # Copy the fundamental reasons
        
        # Add technical analysis
        try:
            # Price to MA50 ratio
            if tech.get("price_to_ma50") is not None:
                price_to_ma50 = float(tech["price_to_ma50"])
                if price_to_ma50 > 1.1:  # Added stronger tier
                    score += 3  # Increased weight
                    reasons.append(f"Very strong bullish trend (price 10% above 50-day MA)")
                elif price_to_ma50 > 1.05:
                    score += 2
                    reasons.append(f"Strong bullish trend (price 5% above 50-day MA)")
                elif price_to_ma50 > 1:
                    score += 1
                    reasons.append("Price above 50-day moving average")
            
            # Price to MA200 ratio
            if tech.get("price_to_ma200") is not None:
                price_to_ma200 = float(tech["price_to_ma200"])
                if price_to_ma200 > 1.2:  # Added stronger tier
                    score += 4  # Increased weight
                    reasons.append(f"Exceptional long-term uptrend (price 20% above 200-day MA)")
                elif price_to_ma200 > 1.1:
                    score += 3
                    reasons.append(f"Strong long-term uptrend (price 10% above 200-day MA)")
                elif price_to_ma200 > 1:
                    score += 2
                    reasons.append("Price above 200-day moving average (bullish)")
            
            # RSI
            if tech.get("rsi") is not None:
                rsi = float(tech["rsi"])
                if 45 <= rsi <= 55:  # Narrower neutral band
                    score += 2  # Increased weight
                    reasons.append(f"RSI in optimal neutral zone ({rsi:.2f})")
                elif 55 < rsi < 65:  # More favorable strength band
                    score += 3  # Increased weight
                    reasons.append(f"RSI showing strength without overheating ({rsi:.2f})")
                elif 65 <= rsi < 70:
                    score += 1
                    reasons.append(f"RSI showing strength ({rsi:.2f})")
                elif rsi >= 70:
                    # Keep as is
                    score -= 1
                    reasons.append(f"RSI in overbought territory ({rsi:.2f})")
                elif 30 < rsi <= 40:  # Better oversold band
                    score += 1
                    reasons.append(f"RSI in potential accumulation zone ({rsi:.2f})")
                elif rsi <= 30:
                    score += 0.5
                    reasons.append(f"RSI in oversold territory - potential bounce ({rsi:.2f})")
            
            # MACD
            if tech.get("macd") is not None and tech.get("macd_signal") is not None:
                macd = float(tech["macd"])
                macd_signal = float(tech["macd_signal"])
                
                if macd > 0 and macd > macd_signal and tech.get("macd_histogram", 0) > 0:
                    score += 3  # Increased weight
                    reasons.append("Strong MACD bullish signal (positive and above signal line)")
                elif macd > macd_signal:
                    score += 2
                    reasons.append("MACD above signal line (bullish)")
                else:
                    # Reduce penalty
                    score -= 0.5  # Reduced penalty
                    reasons.append("MACD below signal line (bearish)")
                    
                # Check for MACD crossover (recent bullish signal)
                if tech.get("macd_histogram", 0) > 0 and tech.get("macd_histogram_prev", 0) < 0:
                    score += 3
                    reasons.append("Recent MACD bullish crossover (strong buy signal)")
            
            # Volume change
            if tech.get("volume_change") is not None:
                volume_change = float(tech["volume_change"])
                if volume_change > 2:  # Added stronger tier
                    score += 2  # Increased weight
                    reasons.append(f"Very high trading volume ({volume_change:.2f}x average)")
                elif volume_change > 1.5:
                    score += 1
                    reasons.append(f"Higher than average volume ({volume_change:.2f}x)")
            
            # Day change (momentum)
            if tech.get("day_change") is not None:
                day_change = float(tech["day_change"])
                if day_change > 3:
                    score += 2
                    reasons.append(f"Strong positive momentum (up {day_change:.2f}% today)")
                elif day_change > 1:
                    score += 1
                    reasons.append(f"Positive momentum (up {day_change:.2f}% today)")
            
            # Volatility assessment
            if tech.get("volatility") is not None:
                volatility = float(tech["volatility"])
                risk_tolerance = int(profile["risk_tolerance"])
                
                # Adjust score based on risk tolerance
                if risk_tolerance >= 8 and volatility > 30:  # High risk tolerance & high volatility
                    score += 1
                    reasons.append(f"High volatility aligned with your risk profile ({volatility:.2f}%)")
                elif 4 <= risk_tolerance <= 7 and 15 <= volatility <= 30:  # Medium risk
                    score += 1
                    reasons.append(f"Moderate volatility aligned with your risk profile ({volatility:.2f}%)")
                elif risk_tolerance <= 3 and volatility < 15:  # Low risk
                    score += 1
                    reasons.append(f"Low volatility aligned with your risk profile ({volatility:.2f}%)")
            
            # Store the final score
            stock_scores[symbol] = {
                "symbol": symbol,
                "name": stock["name"],
                "sector": stock["sector"],
                "market_cap_category": stock["market_cap_category"],
                "score": score,
                "current_price": tech.get("current_price"),
                "pe_ratio": fundamental_data.get(symbol, {}).get("pe_ratio"),
                "dividend_yield": fundamental_data.get(symbol, {}).get("dividend_yield"),
                "reasons": reasons
            }
                
        except Exception as e:
            logger.warning(f"Error processing technical data for {symbol}: {e}")
            continue
    
    # Sort by combined score (descending)
    sorted_stocks = sorted(stock_scores.values(), key=lambda x: x["score"], reverse=True)
    
    # Select top 7-8 stocks for final recommendations
    top_stocks = sorted_stocks[:8]
    
    if not top_stocks:
        logger.warning("No stocks passed both fundamental and technical filters")
        return []
    
    # Format the results
    recommendations = []
    for stock in top_stocks:
        # Normalize recommendation strength to 1-10 scale
        # Reduce the max_possible_score to make it more achievable
        max_possible_score = 25  # Lowered from 30
        min_possible_score = -3  # Raised from -5
        
        # Enhanced normalization to favor higher scores
        normalized_score = ((stock["score"] - min_possible_score) / 
                          (max_possible_score - min_possible_score)) * 10
        
        # Apply mild boost to all scores
        normalized_score = normalized_score * 1.15
        
        # Ensure score is between 1 and 10
        normalized_score = max(1, min(10, normalized_score))
        
        # Select the top 3 reasons (if available)
        # Prioritize fundamental reasons first, then technical
        top_reasons = stock["reasons"][:3] if len(stock["reasons"]) >= 3 else stock["reasons"]
        reason_text = "; ".join(top_reasons)
        
        # Add market cap category to the recommendation
        market_cap_info = f"{stock['market_cap_category']} - " if stock["market_cap_category"] != "Unknown" else ""
        sector_info = stock["sector"] if stock["sector"] != "Unknown" else "Diverse Sector"
        
        recommendations.append({
            "symbol": stock["symbol"],
            "name": stock["name"],
            "sector": f"{market_cap_info}{sector_info}",
            "current_price": stock["current_price"],
            "pe_ratio": stock["pe_ratio"],
            "dividend_yield": stock["dividend_yield"],
            "recommendation_strength": round(normalized_score, 1),
            "reason": reason_text,
            "raw_score": stock["score"]  # Added for debugging
        })
    
    logger.info(f"Generated {len(recommendations)} stock recommendations")
    return recommendations

def recommend_mutual_funds(profile, mutual_fund_data):
    """
    Recommend mutual funds based on user profile and fund data.
    
    Args:
        profile (dict): User's financial profile
        mutual_fund_data (dict): Mutual fund data
        
    Returns:
        list: Recommended mutual funds with reasoning
    """
    logger.info("Generating mutual fund recommendations")
    
    risk_tolerance = int(profile["risk_tolerance"])
    investment_horizon = int(profile["investment_horizon"])
    
    # Determine user's risk category
    risk_category = ""
    if risk_tolerance <= 3:
        risk_category = "Conservative"
    elif risk_tolerance <= 6:
        risk_category = "Moderate"
    else:
        risk_category = "Aggressive"
    
    # Scoring system
    fund_scores = {}
    
    for fund_code, fund in mutual_fund_data.items():
        try:
            score = 0
            reasons = []
            
            # Risk alignment
            fund_risk = None
            if fund.get("risk_rating") is not None:
                try:
                    fund_risk = float(fund["risk_rating"])
                except (ValueError, TypeError):
                    # If risk_rating is not numeric, use a default value
                    fund_risk = 5
            else:
                # Map text risk levels to numeric values if risk_level is provided
                risk_level_map = {
                    "Very Low": 1,
                    "Low": 3,
                    "Medium": 5,
                    "High": 8,
                    "Very High": 10
                }
                risk_level = fund.get("risk_level", "Medium")
                fund_risk = risk_level_map.get(risk_level, 5)
            
            risk_match = 10 - abs(risk_tolerance - fund_risk)
            score += risk_match
            
            if risk_match > 7:
                reasons.append(f"Risk profile aligns well with your tolerance")
            
            # Returns based on investment horizon
            if investment_horizon <= 1:
                # Short-term: prioritize 1-year returns and low risk
                if fund.get("one_year_return") is not None:
                    try:
                        one_year_return = float(fund["one_year_return"])
                        if one_year_return > 10:
                            score += 3
                            reasons.append(f"Strong 1-year return of {one_year_return:.2f}%")
                        elif one_year_return > 5:
                            score += 2
                            reasons.append(f"Good 1-year return of {one_year_return:.2f}%")
                    except (ValueError, TypeError):
                        pass
                
                # Prefer lower risk funds for short term
                if fund_risk < 4:
                    score += 3
                    reasons.append(f"Low risk suitable for short-term investment")
                    
            elif investment_horizon <= 3:
                # Medium-term: balance 1-year and 3-year returns
                if fund.get("one_year_return") is not None and fund.get("three_year_return") is not None:
                    try:
                        one_year_return = float(fund["one_year_return"])
                        three_year_return = float(fund["three_year_return"])
                        avg_return = (one_year_return + three_year_return) / 2
                        if avg_return > 12:
                            score += 3
                            reasons.append(f"Strong avg return of {avg_return:.2f}% over 1-3 years")
                        elif avg_return > 8:
                            score += 2
                            reasons.append(f"Good avg return of {avg_return:.2f}% over 1-3 years")
                    except (ValueError, TypeError):
                        pass
                    
            else:
                # Long-term: prioritize 3-year and 5-year returns
                if fund.get("three_year_return") is not None and fund.get("five_year_return") is not None:
                    try:
                        three_year_return = float(fund["three_year_return"])
                        five_year_return = float(fund["five_year_return"])
                        avg_return = (three_year_return + five_year_return) / 2
                        if avg_return > 12:
                            score += 5
                            reasons.append(f"Excellent avg return of {avg_return:.2f}% over 3-5 years")
                        elif avg_return > 9:
                            score += 3
                            reasons.append(f"Strong avg return of {avg_return:.2f}% over 3-5 years")
                    except (ValueError, TypeError):
                        pass
            
            # Fund category alignment based on asset allocation
            asset_allocation = determine_asset_allocation(profile)
            equity_allocation = asset_allocation["equity"]
            debt_allocation = asset_allocation["debt"]
            
            category = fund.get("category", "")
            
            if equity_allocation > 60 and category == "Equity":
                score += 2
                reasons.append("Equity fund aligns with your recommended asset allocation")
            elif debt_allocation > 60 and category == "Debt":
                score += 2
                reasons.append("Debt fund aligns with your recommended asset allocation")
            elif 40 <= equity_allocation <= 60 and category == "Hybrid":
                score += 3
                reasons.append("Hybrid fund perfectly aligns with your balanced allocation")
            
            # Expense ratio consideration
            if fund.get("expense_ratio") is not None:
                try:
                    expense_ratio = float(fund["expense_ratio"])
                    if expense_ratio < 0.5:
                        score += 2
                        reasons.append(f"Very low expense ratio of {expense_ratio:.2f}%")
                    elif expense_ratio < 1.0:
                        score += 1
                        reasons.append(f"Low expense ratio of {expense_ratio:.2f}%")
                except (ValueError, TypeError):
                    pass
            
            # AUM size consideration (larger is generally more stable)
            if fund.get("aum_crores") is not None:
                try:
                    aum_crores = float(fund["aum_crores"])
                    if aum_crores > 5000:
                        score += 1
                        reasons.append(f"Large fund size of ₹{aum_crores:.2f} crores")
                except (ValueError, TypeError):
                    pass
            
            # Store the score
            fund_scores[fund_code] = {
                "code": fund_code,
                "name": fund.get("name"),
                "category": fund.get("category"),
                "nav": fund.get("nav"),
                "one_year_return": fund.get("one_year_return"),
                "three_year_return": fund.get("three_year_return"),
                "five_year_return": fund.get("five_year_return"),
                "expense_ratio": fund.get("expense_ratio"),
                "score": score,
                "reasons": reasons
            }
        except Exception as e:
            logger.warning(f"Error processing mutual fund {fund_code}: {e}")
            continue
    
    # Sort by score (descending)
    sorted_funds = sorted(fund_scores.values(), key=lambda x: x["score"], reverse=True)
    
    # Select top 5-7 funds
    top_funds = sorted_funds[:7]
    
    # Format the results
    recommendations = []
    for fund in top_funds:
        # Select the top 2 reasons
        top_reasons = fund["reasons"][:2] if len(fund["reasons"]) >= 2 else fund["reasons"]
        reason_text = "; ".join(top_reasons)
        
        recommendations.append({
            "code": fund["code"],
            "name": fund["name"],
            "category": fund["category"],
            "nav": fund["nav"],
            "expense_ratio": fund["expense_ratio"],
            "returns": {
                "1yr": fund["one_year_return"],
                "3yr": fund["three_year_return"],
                "5yr": fund["five_year_return"]
            },
            "reason": reason_text
        })
    
    logger.info(f"Generated {len(recommendations)} mutual fund recommendations")
    return recommendations

def recommend_commodities(profile, commodity_data):
    """
    Recommend commodities based on user profile and commodity data.
    
    Args:
        profile (dict): User's financial profile
        commodity_data (dict): Commodity data
        
    Returns:
        list: Recommended commodities with reasoning
    """
    logger.info("Generating commodity recommendations")
    
    risk_tolerance = int(profile["risk_tolerance"])
    investment_horizon = int(profile["investment_horizon"])
    
    # Asset allocation to determine commodity percentage
    asset_allocation = determine_asset_allocation(profile)
    commodity_allocation = asset_allocation["commodities"]
    
    # Scoring system
    commodity_scores = {}
    
    for commodity_name, commodity in commodity_data.items():
        try:
            score = 0
            reasons = []
            
            # Basic score based on commodity type
            if commodity_name == "Gold":
                score += 5
                reasons.append("Gold is a traditional hedge against inflation and market volatility")
            elif commodity_name == "Silver":
                score += 4
                reasons.append("Silver offers industrial usage and investment potential")
            elif "Oil" in commodity_name:
                score += 3
                reasons.append("Energy commodities offer portfolio diversification")
            else:
                score += 2
                reasons.append(f"{commodity_name} adds diversification to your portfolio")
            
            # Performance based on day_change
            if commodity.get("day_change") is not None:
                try:
                    day_change = float(commodity["day_change"])
                    if day_change > 1.0:
                        score += 2
                        reasons.append(f"Showing positive momentum ({day_change:.2f}%)")
                    elif day_change > 0:
                        score += 1
                        reasons.append(f"Slight positive trend ({day_change:.2f}%)")
                    elif day_change < -1.0:
                        score -= 1
                        reasons.append(f"Recent downward trend ({day_change:.2f}%)")
                except (ValueError, TypeError):
                    pass
            
            # Portfolio alignment based on risk tolerance
            if risk_tolerance <= 3:
                # Conservative investors - prefer gold
                if commodity_name == "Gold":
                    score += 3
                    reasons.append("Gold aligns well with your conservative risk profile")
            elif risk_tolerance <= 7:
                # Moderate investors - balanced approach
                if commodity_name in ["Gold", "Silver"]:
                    score += 2
                    reasons.append("Precious metals align with your moderate risk profile")
            else:
                # Aggressive investors - more industrial commodities
                if commodity_name not in ["Gold", "Silver"]:
                    score += 2
                    reasons.append(f"{commodity_name} offers growth potential matching your higher risk profile")
            
            # Investment horizon considerations
            if investment_horizon <= 2:
                # Short-term - prefer more stable commodities
                if commodity_name == "Gold":
                    score += 2
                    reasons.append("Suitable for your shorter investment horizon")
            elif investment_horizon >= 5:
                # Long-term - industrial commodities can perform better
                if commodity_name in ["Copper", "Aluminium", "Crude Oil"]:
                    score += 2
                    reasons.append("Good for long-term growth with your investment horizon")
            
            # Strategic allocation based on portfolio percentage
            if commodity_allocation <= 5:
                # Small allocation - focus on stability
                if commodity_name == "Gold":
                    score += 1
                    reasons.append("Optimal for small commodity allocation in your portfolio")
            
            # Get current price for recommendation
            current_price = commodity.get("current_price", 0)
            if not current_price:
                current_price = 0
            
            # Unit for display
            unit = commodity.get("unit", "")
            
            # Store the score
            commodity_scores[commodity_name] = {
                "name": commodity_name,
                "score": score,
                "current_price": current_price,
                "unit": unit,
                "reasons": reasons
            }
        except Exception as e:
            logger.warning(f"Error processing commodity {commodity_name}: {e}")
            continue
    
    # Sort by score (descending)
    sorted_commodities = sorted(commodity_scores.values(), key=lambda x: x["score"], reverse=True)
    
    # Select top 3 commodities
    top_commodities = sorted_commodities[:3]
    
    # Format the results
    recommendations = []
    for commodity in top_commodities:
        # Select the top 2 reasons (if available)
        top_reasons = commodity["reasons"][:2] if len(commodity["reasons"]) >= 2 else commodity["reasons"]
        reason_text = "; ".join(top_reasons)
        
        current_price = commodity.get("current_price")
        if current_price is None:
            current_price = 0
            
        recommendations.append({
            "name": commodity["name"],
            "current_price": current_price,
            "unit": commodity.get("unit", ""),
            "reason": reason_text
        })
    
    logger.info(f"Generated {len(recommendations)} commodity recommendations")
    return recommendations

def recommend_sip(profile, sip_data):
    """
    Recommend SIP plans based on user profile and SIP data.
    
    Args:
        profile (dict): User's financial profile
        sip_data (dict): SIP data
        
    Returns:
        list: Recommended SIP plans with reasoning
    """
    logger.info("Generating SIP recommendations")
    
    risk_tolerance = profile["risk_tolerance"]
    investment_horizon = profile["investment_horizon"]
    
    # Calculate investment capacity
    capacity = calculate_investment_capacity(profile)
    recommended_monthly_investment = capacity["recommended_monthly_investment"]
    
    # Determine asset allocation
    asset_allocation = determine_asset_allocation(profile)
    
    # Scoring system
    sip_scores = {}
    
    for sip_name, sip in sip_data.items():
        score = 0
        reasons = []
        
        # Risk alignment based on risk_level or risk_rating
        if sip.get("risk_level") is not None:
            # Convert text risk level to numeric
            risk_level_map = {
                "Very Low": 1,
                "Low": 3,
                "Medium": 5,
                "High": 8,
                "Very High": 10
            }
            sip_risk_numeric = risk_level_map.get(sip["risk_level"], 5)
            risk_match = 10 - abs(risk_tolerance - sip_risk_numeric)
            score += risk_match
            
            if risk_match > 7:
                reasons.append(f"Risk profile aligns well with your tolerance")
        elif sip.get("risk_rating") is not None:
            risk_match = 10 - abs(risk_tolerance - sip["risk_rating"])
            score += risk_match
            
            if risk_match > 7:
                reasons.append(f"Risk profile aligns well with your tolerance")
        
        # Investment horizon alignment
        if sip.get("recommended_duration") is not None:
            # Handle both string range and direct integer value
            recommended_duration = sip["recommended_duration"]
            min_duration = None
            
            if isinstance(recommended_duration, str) and "-" in recommended_duration:
                # Handle string format like "5-10 years"
                try:
                    duration_range = recommended_duration.split("-")
                    min_duration = int(duration_range[0])
                except (ValueError, IndexError):
                    min_duration = None
            elif isinstance(recommended_duration, (int, float)):
                # Handle direct numeric value
                min_duration = recommended_duration
            
            if min_duration is not None:
                if investment_horizon >= min_duration:
                    score += 3
                    reasons.append(f"Your investment horizon of {investment_horizon} years meets the recommended minimum of {min_duration} years")
                else:
                    score -= 2
                    reasons.append(f"Your investment horizon of {investment_horizon} years is less than the recommended minimum of {min_duration} years")
        
        # Asset allocation alignment
        if "Equity" in sip_name and asset_allocation["equity"] > 50:
            score += 2
            reasons.append("Equity allocation aligns with your asset allocation strategy")
        
        if "Balanced" in sip_name and 30 <= asset_allocation["equity"] <= 70:
            score += 3
            reasons.append("Balanced fund perfectly suits your moderate asset allocation")
        
        if "Debt" in sip_name and asset_allocation["debt"] > 40:
            score += 2
            reasons.append("Debt allocation aligns with your asset allocation strategy")
        
        if "ELSS" in sip_name or "Tax" in sip_name:
            # Only recommend ELSS if it fits the risk profile
            if risk_tolerance >= 6:
                score += 2
                reasons.append("ELSS provides tax benefits under Section 80C")
            else:
                score -= 1
                reasons.append("ELSS may be too risky for your profile despite tax benefits")
        
        # Minimum investment consideration
        if sip.get("min_investment") is not None:
            if recommended_monthly_investment >= sip["min_investment"] * 3:
                score += 1
                reasons.append(f"Your monthly investment capacity easily covers the minimum requirement")
            elif recommended_monthly_investment < sip["min_investment"]:
                score -= 3
                reasons.append(f"Minimum investment of ₹{sip['min_investment']} exceeds your monthly capacity")
        
        # Store the score
        sip_scores[sip_name] = {
            "name": sip_name,
            "risk_level": sip.get("risk_level"),
            "min_investment": sip.get("min_investment"),
            "recommended_duration": sip.get("recommended_duration"),
            "expected_returns": sip.get("expected_returns"),
            "tax_benefits": sip.get("tax_benefits", "No"),
            "score": score,
            "reasons": reasons
        }
    
    # Sort by score (descending)
    sorted_sips = sorted(sip_scores.values(), key=lambda x: x["score"], reverse=True)
    
    # Select top 5 SIPs
    top_sips = sorted_sips[:5]
    
    # Calculate suggested monthly amount for each SIP
    total_allocation = sum(sip["score"] for sip in top_sips) if top_sips else 1
    
    # Format the results
    recommendations = []
    for sip in top_sips:
        # Calculate allocation proportion based on score
        allocation_ratio = sip["score"] / total_allocation if total_allocation > 0 else 0.2
        suggested_monthly = round(recommended_monthly_investment * allocation_ratio, -2)  # Round to nearest 100
        
        # Ensure suggested amount is at least the minimum
        if sip.get("min_investment") and suggested_monthly < sip["min_investment"]:
            suggested_monthly = sip["min_investment"]
        
        # Select the top 2 reasons
        top_reasons = sip["reasons"][:2] if len(sip["reasons"]) >= 2 else sip["reasons"]
        reason_text = "; ".join(top_reasons)
        
        recommendations.append({
            "name": sip["name"],
            "risk_level": sip["risk_level"],
            "monthly_amount": suggested_monthly,
            "min_investment": sip["min_investment"],
            "expected_returns": sip["expected_returns"],
            "tax_benefits": sip.get("tax_benefits", "No"),
            "reason": reason_text
        })
    
    logger.info(f"Generated {len(recommendations)} SIP recommendations")
    return recommendations

def get_risk_management_tips(profile):
    """
    Provide risk management tips based on user profile.
    
    Args:
        profile (dict): User's financial profile
        
    Returns:
        list: Risk management tips
    """
    logger.info("Generating risk management tips")
    
    risk_tolerance = profile["risk_tolerance"]
    investment_horizon = profile["investment_horizon"]
    monthly_income = profile["monthly_income"]
    monthly_expense = profile["monthly_expense"]
    current_debt = profile["current_debt"]
    
    tips = []
    
    # General tips for everyone
    tips.append("Always maintain an emergency fund of at least 6 months of expenses.")
    tips.append("Diversify your investments across asset classes to reduce risk.")
    
    # Debt management
    debt_to_income = current_debt / (monthly_income * 12) if monthly_income > 0 else float('inf')
    if debt_to_income > 0.5:
        tips.append("Your debt level is high. Consider prioritizing debt reduction before increasing investments.")
        tips.append("Focus on high-interest debt first to reduce interest costs.")
    
    # Savings rate
    savings_rate = (monthly_income - monthly_expense) / monthly_income if monthly_income > 0 else 0
    if savings_rate < 0.2:
        tips.append("Your savings rate is low. Try to increase it to at least 20% of income for long-term financial security.")
    
    # Insurance
    tips.append("Ensure you have adequate health and term life insurance before investing.")
    
    # Investment horizon specific
    if investment_horizon < 3:
        tips.append("For short-term goals, prioritize capital preservation over returns. Avoid high-risk investments.")
        tips.append("Consider liquid funds and short-term debt funds for goals within 1-3 years.")
    elif investment_horizon < 7:
        tips.append("For medium-term goals (3-7 years), consider a balanced approach with a mix of equity and debt.")
        tips.append("Use SIPs to average out market volatility over your investment period.")
    else:
        tips.append("For long-term goals (7+ years), equity exposure can be higher as you have time to ride out market fluctuations.")
        tips.append("Consider index funds for long-term core equity exposure with lower expense ratios.")
    
    # Risk tolerance specific
    if risk_tolerance <= 3:
        tips.append("With your conservative risk profile, focus on capital preservation with larger allocation to debt and high-quality large-cap stocks.")
        tips.append("Consider regular portfolio rebalancing to ensure risk levels don't exceed your comfort zone.")
    elif risk_tolerance <= 7:
        tips.append("With your moderate risk profile, maintain a balanced portfolio with regular rebalancing.")
        tips.append("Consider reducing equity exposure if approaching financial goals within 2-3 years.")
    else:
        tips.append("With your aggressive risk profile, still ensure at least 10-15% in less volatile assets as a safety cushion.")
        tips.append("Set strict stop-loss limits for high-risk investments to prevent major losses.")
    
    # Tax efficiency
    tips.append("Consider tax-efficient investment options like ELSS funds for equity and debt funds held for over 3 years.")
    tips.append("Utilize tax-saving options under Section 80C, 80D, and other applicable deductions.")
    
    # Beware of common mistakes
    tips.append("Avoid timing the market; instead, focus on time in the market through disciplined investing.")
    tips.append("Don't chase past performance blindly; assess if the investment strategy aligns with your goals.")
    
    # Monitoring
    tips.append("Review your portfolio at least quarterly, but avoid frequent changes based on short-term market movements.")
    tips.append("Reassess your risk profile and investment strategy annually or after major life events.")
    
    logger.info(f"Generated {len(tips)} risk management tips")
    return tips 