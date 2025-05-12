# Indian Investment Recommendation System

A comprehensive Python-based investment recommendation system for Indian stocks, mutual funds, commodities, and SIPs. The system analyzes user financial profiles and provides personalized investment recommendations based on fundamental data, technical analysis, and market sentiment.

## Features

- **User Financial Profile Analysis**: Analyzes income, expenses, savings, existing investments, debt, risk tolerance, and investment horizon.
- **Data Collection**: Fetches data from multiple sources including yfinance, NSE, screener.in, and other financial websites.
- **Market Sentiment Analysis**: Analyzes news about Indian markets using NLP to understand market sentiment.
- **Comprehensive Recommendations**:
  - Stocks (based on technical, fundamental, and sentiment analysis)
  - Mutual Funds
  - Commodities
  - Systematic Investment Plans (SIPs)
- **Risk Management**: Provides personalized risk management tips based on user profiles.

## Installation

1. Clone this repository:
```
git clone https://github.com/yourusername/indian-investment-recommendation.git
cd indian-investment-recommendation
```

2. Install the required packages:
```
pip install -r requirements.txt
```

3. Download NLTK data:
```python
import nltk
nltk.download('vader_lexicon')
nltk.download('punkt')
```

## Usage

Run the main script:
```
python recommendation_system.py
```

The system will:
1. Ask for your financial profile (income, expenses, savings, etc.)
2. Collect market data (this may take a few minutes)
3. Ask if you want to run in test mode (faster) or full mode
4. Analyze the data and generate personalized recommendations
5. Display the results and save them to CSV files

## Modules

- **recommendation_system.py**: Main script that orchestrates the recommendation process
- **data_collection.py**: Collects data from various sources
- **sentiment_analysis.py**: Analyzes market sentiment using NLP
- **recommendation_engine.py**: Generates personalized recommendations

## Data Sources

- NSE stock list: https://archives.nseindia.com/content/equities/EQUITY_L.csv
- Technical data: yfinance
- Fundamental data: screener.in and yfinance
- Market news: Economic Times, Money Control, Business Standard

## Limitations

- The system uses simulated data for some fields that aren't readily available from free sources
- Mutual fund, SIP, and commodity data use simplified models
- Web scraping may break if websites change their structure
- Market sentiment analysis is based on a limited number of news sources
- The system should be used for educational purposes only, not as the sole basis for investment decisions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is for educational purposes only. It is not intended to provide investment advice. Always consult with a qualified financial advisor before making investment decisions. The creators of this software are not responsible for any financial losses incurred using this system. 