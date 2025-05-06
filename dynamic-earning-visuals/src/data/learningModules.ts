import { ReactNode } from 'react';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export interface LearningSection {
  id: number;
  title: string;
  content: string;
  animationComponent?: string; // name of component to import dynamically
  quiz?: QuizQuestion[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string; // e.g. "30 min"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  sections: LearningSection[];
}

export const learningModules: LearningModule[] = [
  {
    id: 'risk-management-basics',
    title: 'Basics of Risk Management',
    description: 'Learn how to understand, assess, and manage financial risks in your investment journey.',
    imageUrl: '/images/learn/risk-management.jpg',
    duration: '45 min',
    difficulty: 'Beginner',
    sections: [
      {
        id: 1,
        title: 'Understanding Financial Risk',
        content: `
# Understanding Financial Risk

Financial risk is the possibility that an investment's actual return will differ from what was expected. This could mean losing some or all of the original investment.

## Types of Financial Risk

1. **Market Risk**: The risk that the value of an investment will decrease due to market factors. This is the most common type of risk and affects all investments to some degree.

2. **Credit Risk**: The risk that a borrower will default on their debt obligations. This is most relevant for bonds and fixed-income investments.

3. **Liquidity Risk**: The risk that an investment cannot be bought or sold quickly enough to prevent a loss or make a required payment.

4. **Inflation Risk**: The risk that the purchasing power of your investments will decrease due to inflation.

5. **Interest Rate Risk**: The risk that changes in interest rates will affect the value of investments, particularly bonds.

## Risk vs. Return

In investing, there's a direct relationship between risk and potential return. Generally:

- **Lower risk investments** (like government bonds) offer lower potential returns
- **Higher risk investments** (like stocks) offer higher potential returns

This relationship is fundamental to understanding how to build a portfolio that matches your financial goals and risk tolerance.

## Real-Life Example

Consider two investments:
- A government bond paying 2% interest annually with very low risk
- A tech startup stock with potential returns of 20% but high risk of losing value

Neither option is inherently "better" - the right choice depends on your personal situation, goals, and risk tolerance.
        `,
        animationComponent: 'RiskToleranceAnimation'
      },
      {
        id: 2,
        title: 'Assessing Your Risk Tolerance',
        content: `
# Assessing Your Risk Tolerance

Risk tolerance is your ability and willingness to endure declines in the value of your investments. Understanding your risk tolerance is crucial for building a suitable investment strategy.

## Factors Affecting Risk Tolerance

1. **Time Horizon**: Generally, the longer your investment timeframe, the more risk you can afford to take. Young investors saving for retirement might have 30+ years to recover from market downturns.

2. **Financial Situation**: Your income stability, existing savings, debt levels, and financial obligations all affect how much risk you can take.

3. **Investment Goals**: Your specific objectives (retirement, home purchase, education funding) influence appropriate risk levels.

4. **Psychological Factors**: Some people are naturally more comfortable with uncertainty and volatility than others.

## How to Determine Your Risk Tolerance

Consider these questions:
- How would you react if your investments dropped 20% in value?
- Do you need this money within the next 5 years?
- Do market fluctuations keep you awake at night?
- How stable is your income and employment?

## Risk Tolerance Profiles

### Conservative
- Priority: Preserving capital
- Comfortable with: Lower returns in exchange for stability
- Typical allocation: Higher percentage in bonds and cash

### Moderate
- Priority: Balance between growth and stability
- Comfortable with: Some fluctuations for long-term growth
- Typical allocation: Mix of stocks and bonds

### Aggressive
- Priority: Maximum growth
- Comfortable with: Significant short-term fluctuations
- Typical allocation: Higher percentage in stocks and alternative investments

Remember: Your risk tolerance may change over time as your financial situation and life circumstances evolve.
        `,
        quiz: [
          {
            id: 1,
            question: 'Which of the following investors would likely have the highest risk tolerance?',
            options: [
              'A 30-year-old with stable income saving for retirement in 35 years',
              'A 60-year-old retiree living off investment income',
              'A 45-year-old saving for a house down payment needed in 2 years',
              'A 50-year-old with unstable income and high debt'
            ],
            correctAnswer: 0,
            explanation: 'The 30-year-old investor has the longest time horizon (35 years), giving them the most time to recover from potential market downturns. This typically allows for a higher risk tolerance compared to the other scenarios.'
          },
          {
            id: 2,
            question: 'Which factor typically has the MOST significant impact on risk tolerance?',
            options: [
              'Your investment knowledge',
              'Your time horizon',
              'Your income level',
              'Your education background'
            ],
            correctAnswer: 1,
            explanation: 'Time horizon is typically the most significant factor affecting risk tolerance. The longer you can leave your money invested, the more risk you can generally afford to take, as you have more time to recover from market downturns.'
          },
          {
            id: 3,
            question: 'If your investments dropped 15% in value, which response would indicate a higher risk tolerance?',
            options: [
              'Immediately selling all investments to prevent further losses',
              'Feeling anxious but making no changes to your portfolio',
              'Seeing it as an opportunity to buy more investments at lower prices',
              'Switching all holdings to cash and bonds'
            ],
            correctAnswer: 2,
            explanation: 'Seeing a market decline as a buying opportunity indicates a high risk tolerance. This investor understands market volatility and is comfortable with the risk, even seeing downturns as potential opportunities rather than threats.'
          },
          {
            id: 4,
            question: 'Which investment allocation would be most appropriate for someone with a LOW risk tolerance?',
            options: [
              '80% stocks, 15% bonds, 5% cash',
              '60% stocks, 30% bonds, 10% cash',
              '40% stocks, 50% bonds, 10% cash',
              '20% stocks, 60% bonds, 20% cash'
            ],
            correctAnswer: 3,
            explanation: 'A portfolio with only 20% in stocks and the majority in bonds and cash would be most appropriate for someone with low risk tolerance. This allocation prioritizes capital preservation and income over growth.'
          },
          {
            id: 5,
            question: 'As you approach retirement, your risk tolerance typically:',
            options: [
              'Increases, because you have more wealth accumulated',
              'Decreases, because you have less time to recover from losses',
              'Stays the same throughout your life',
              'Is no longer relevant to investment decisions'
            ],
            correctAnswer: 1,
            explanation: 'Risk tolerance typically decreases as you approach retirement because your time horizon shortens. With less time to recover from potential market downturns, most investors shift toward more conservative allocations to protect their accumulated wealth.'
          }
        ]
      },
      {
        id: 3,
        title: 'Risk Management Strategies',
        content: `
# Risk Management Strategies

Once you understand various investment risks and your personal risk tolerance, you can implement strategies to manage risk effectively.

## Diversification

Diversification is one of the most powerful risk management tools. By spreading investments across different asset classes, industries, and geographic regions, you can reduce the impact of any single investment performing poorly.

### Example:
Rather than investing all your money in a single company's stock, you might invest in:
- A diverse range of stocks across different sectors
- Some bonds for stability
- Real estate investments for further diversification
- Maybe some international investments to reduce geographic concentration

## Asset Allocation

Asset allocation is the process of dividing your investments among different asset categories like stocks, bonds, and cash. The right allocation depends on your:

- Risk tolerance
- Time horizon
- Investment goals

A common rule of thumb suggests subtracting your age from 110 to determine the percentage of your portfolio to allocate to stocks. For example, a 30-year-old might have 80% in stocks (110-30=80) and 20% in bonds.

## Dollar-Cost Averaging

This strategy involves investing a fixed amount of money at regular intervals, regardless of market conditions. Benefits include:

- Reducing the impact of market volatility
- Avoiding the risk of investing all your money at a market peak
- Creating a disciplined approach to investing

## Regular Portfolio Rebalancing

Over time, some investments will grow faster than others, shifting your portfolio away from your target allocation. Rebalancing involves periodically buying and selling assets to maintain your desired risk level.

## Setting Stop-Loss Orders

For active investors, stop-loss orders automatically sell an investment when it reaches a specified price, limiting potential losses.

## The Importance of an Emergency Fund

Before taking on investment risk, establish an emergency fund covering 3-6 months of expenses. This financial buffer prevents you from being forced to sell investments at an inopportune time due to unexpected expenses.

Remember: No risk management strategy is perfect. The goal is not to eliminate risk entirely (which would also eliminate return potential) but to manage it appropriately for your situation.
        `,
        animationComponent: 'CompoundingAnimation',
        quiz: [
          {
            id: 1,
            question: 'What is the primary benefit of diversification?',
            options: [
              'It guarantees positive returns in all market conditions',
              'It reduces the impact of poor performance from any single investment',
              'It eliminates all risk from your portfolio',
              'It maximizes returns above market averages'
            ],
            correctAnswer: 1,
            explanation: 'Diversification reduces the impact of poor performance from any single investment by spreading investments across different assets. While it doesn\'t guarantee positive returns or eliminate all risk, it helps manage risk by ensuring that not all investments are affected by the same market events in the same way.'
          },
          {
            id: 2,
            question: 'What is dollar-cost averaging?',
            options: [
              'Buying investments only when markets are down',
              'Investing all your money at once to maximize returns',
              'Investing a fixed amount at regular intervals regardless of price',
              'Calculating the exact dollar amount needed for retirement'
            ],
            correctAnswer: 2,
            explanation: 'Dollar-cost averaging is investing a fixed amount of money at regular intervals, regardless of market conditions or price. This strategy helps reduce the impact of volatility and avoids the risk of investing all your money at a market peak.'
          },
          {
            id: 3,
            question: 'Why is portfolio rebalancing important?',
            options: [
              'It guarantees higher returns',
              'It eliminates all taxes on investments',
              'It ensures your portfolio maintains your target risk level',
              'It prevents you from having to buy new investments'
            ],
            correctAnswer: 2,
            explanation: 'Portfolio rebalancing is important because it ensures your portfolio maintains your target risk level over time. As different assets grow at different rates, your allocation can drift from your original plan. Rebalancing brings your portfolio back in line with your risk tolerance and investment goals.'
          },
          {
            id: 4,
            question: 'Which of these would NOT typically be considered part of a risk management strategy?',
            options: [
              'Maintaining an emergency fund',
              'Diversifying across different asset classes',
              'Timing the market to buy at lows and sell at peaks',
              'Regular portfolio rebalancing'
            ],
            correctAnswer: 2,
            explanation: 'Trying to time the market (buying at lows and selling at peaks) is NOT typically considered a sound risk management strategy because it\'s extremely difficult to execute successfully and often leads to poor results. The other options are all established risk management techniques.'
          },
          {
            id: 5,
            question: 'A well-diversified portfolio typically includes:',
            options: [
              'Only stocks from different companies',
              'Only a mix of stocks and bonds',
              'Different asset classes, sectors, and geographic regions',
              'At least 50 different individual stocks'
            ],
            correctAnswer: 2,
            explanation: 'A well-diversified portfolio typically includes investments across different asset classes (stocks, bonds, perhaps real estate), sectors (technology, healthcare, finance, etc.), and geographic regions (domestic and international). Simply owning many stocks or a mix of stocks and bonds may not provide sufficient diversification.'
          }
        ]
      },
      {
        id: 4,
        title: 'Risk Management in Practice',
        content: `
# Risk Management in Practice

Let's explore how to apply risk management principles to real-world financial scenarios.

## Case Study: Building a Portfolio Based on Risk Profile

### Meet Priya: Young Professional (Age 28)
- **Time Horizon**: 30+ years until retirement
- **Risk Tolerance**: High
- **Financial Situation**: Stable job, no dependents, low debt
- **Appropriate Strategy**: 
  - 80-90% stocks (including international exposure)
  - 10-20% bonds
  - Regular contributions through workplace retirement plan
  - Focus on growth

### Meet Rahul: Mid-Career (Age 45)
- **Time Horizon**: 20 years until retirement
- **Risk Tolerance**: Moderate
- **Financial Situation**: Stable career, children's education to fund
- **Appropriate Strategy**:
  - 60-70% stocks
  - 25-35% bonds
  - 5% cash reserves
  - Beginning to shift focus from pure growth toward balance

### Meet Aarav and Meera: Near Retirement (Age 60)
- **Time Horizon**: 5 years until retirement
- **Risk Tolerance**: Conservative
- **Financial Situation**: Substantial savings, mortgage nearly paid
- **Appropriate Strategy**:
  - 40-50% stocks
  - 40-50% bonds
  - 10% cash/money market
  - Focus on capital preservation and income

## Adapting to Life Changes

Your risk management strategy should evolve with your life circumstances:

- **Career advancement**: May allow for more aggressive investing
- **Starting a family**: May require more conservative approach temporarily
- **Receiving inheritance**: Opportunity to reconsider asset allocation
- **Health issues**: May require more liquid assets
- **Approaching retirement**: Generally calls for reducing risk

## Common Risk Management Mistakes to Avoid

1. **Panic selling during market downturns**
   - Historical perspective: Markets have always recovered eventually
   - Emotional reactions often lead to buying high and selling low

2. **Inadequate diversification**
   - Over-concentration in a single company (often employer stock)
   - Regional concentration (only investing in your home country)

3. **Ignoring inflation risk**
   - Being too conservative can mean losing purchasing power over time
   - Some exposure to growth assets is important even for conservative investors

4. **Chasing past performance**
   - Last year's winners often don't repeat
   - Consistent strategy typically outperforms frequent changes

Remember: The best risk management approach is one you can stick with through market ups and downs. Consistency often matters more than finding the "perfect" strategy.
        `,
        quiz: [
          {
            id: 1,
            question: 'As you approach retirement, your asset allocation should typically:',
            options: [
              'Become more aggressive to maximize final returns',
              'Remain exactly the same as during your working years',
              'Shift toward more conservative investments',
              'Move entirely to cash to eliminate all risk'
            ],
            correctAnswer: 2,
            explanation: 'As you approach retirement, your asset allocation should typically shift toward more conservative investments. With less time to recover from market downturns and a greater need for capital preservation, reducing exposure to volatile assets becomes important. However, some growth investments remain necessary to fund retirement.'
          },
          {
            id: 2,
            question: 'Which scenario would likely call for a MORE aggressive risk management approach?',
            options: [
              'A single 30-year-old with no debt and a secure job',
              'A 45-year-old sole breadwinner with three children approaching college age',
              'A 35-year-old with a large emergency fund and diversified income sources',
              'A 25-year-old with high income and no major financial obligations'
            ],
            correctAnswer: 1,
            explanation: 'A 45-year-old sole breadwinner with three children approaching college age would likely need a more conservative approach. This person has significant financial obligations in the near future (college expenses) and others depending on their income, making capital preservation more important.'
          },
          {
            id: 3,
            question: 'What is typically considered the BIGGEST risk management mistake?',
            options: [
              'Investing too conservatively in your 20s and 30s',
              'Panic selling during market downturns',
              'Not checking your portfolio daily',
              'Having too small a percentage in international investments'
            ],
            correctAnswer: 1,
            explanation: 'Panic selling during market downturns is typically considered the biggest risk management mistake. Emotional reactions to market volatility often lead to selling low and buying high - the opposite of successful investing. This behavior can significantly damage long-term returns.'
          },
          {
            id: 4,
            question: 'Why is inflation an important consideration in risk management?',
            options: [
              'Inflation only affects stock investments, not bonds',
              'Inflation can erode purchasing power if returns don\'t exceed it',
              'Inflation always decreases during market downturns',
              'Inflation only matters for international investments'
            ],
            correctAnswer: 1,
            explanation: 'Inflation is important because it can erode purchasing power if investment returns don\'t exceed it. Even "safe" investments can lose real value over time if their returns don\'t keep pace with inflation. This is why even conservative investors typically need some growth-oriented investments.'
          },
          {
            id: 5,
            question: 'Which statement about investment risk is most accurate?',
            options: [
              'The goal of risk management is to eliminate all risk from a portfolio',
              'Risk management is only important for investors with large portfolios',
              'The ideal risk management strategy never changes throughout life',
              'Effective risk management balances risk reduction with return potential'
            ],
            correctAnswer: 3,
            explanation: 'Effective risk management balances risk reduction with return potential. The goal isn\'t to eliminate all risk (which would also eliminate return potential) but to manage it appropriately for your situation. Risk management is important for all investors, and strategies should evolve throughout life.'
          }
        ]
      }
    ]
  },
  {
    id: 'mutual-funds-101',
    title: 'Mutual Funds 101',
    description: 'Learn the basics of mutual funds and how they can fit into your investment strategy.',
    imageUrl: '/images/learn/mutual-funds.jpg',
    duration: '35 min',
    difficulty: 'Beginner',
    sections: [
      {
        id: 1,
        title: 'Introduction to Mutual Funds',
        content: `# Introduction to Mutual Funds

Mutual funds are a popular investment vehicle designed for both beginning and experienced investors. This section covers what mutual funds are and their basic structure.

## Coming Soon

This learning module is under development. Check back soon for the complete content.`
      }
    ]
  },
  {
    id: 'stock-market-fundamentals',
    title: 'Stock Market Fundamentals',
    description: 'Understand how the stock market works and learn to evaluate potential investments.',
    imageUrl: '/images/learn/stock-market.jpg',
    duration: '60 min',
    difficulty: 'Beginner',
    sections: [
      {
        id: 1,
        title: 'Introduction to Stocks',
        content: `# Introduction to Stocks

This module will help you understand what stocks are, how the market works, and basic evaluation metrics.

## Coming Soon

This learning module is under development. Check back soon for the complete content.`
      }
    ]
  }
];

export const findModuleById = (moduleId: string): LearningModule | undefined => {
  return learningModules.find(module => module.id === moduleId);
};

export const findSectionById = (moduleId: string, sectionId: number): LearningSection | undefined => {
  const module = findModuleById(moduleId);
  return module?.sections.find(section => section.id === sectionId);
}; 