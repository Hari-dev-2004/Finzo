import { LearningModule } from '@/types/learn';

export const riskManagementModule: LearningModule = {
  id: 'risk-management-basics',
  title: 'Basics of Risk Management',
  description: 'Learn essential principles of financial risk management, including identifying, measuring, and mitigating various types of risk in your investment portfolio.',
  coverImage: '/images/learn/risk-management.jpg',
  level: 'beginner',
  durationMinutes: 120,
  tags: ['risk', 'investing', 'portfolio management', 'finance basics'],
  sections: [
    {
      id: 'introduction',
      title: 'Understanding Risk',
      blocks: [
        {
          id: 'intro-1',
          type: 'text',
          content: `# Introduction to Risk Management

Risk is a fundamental part of investing and financial planning. Before diving deeper, let's define what risk actually means in financial terms:

**Financial Risk**: The potential for losing money or experiencing returns different from what was expected.

Risk management is not about eliminating risk entirely (which is impossible), but rather about:
- Identifying potential risks
- Measuring their potential impact
- Implementing strategies to mitigate their effects
- Making informed decisions based on your risk tolerance`
        },
        {
          id: 'intro-2',
          type: 'animation',
          content: 'Balance scale with "Risk" and "Return" on opposite sides',
          animation: {
            type: 'balanceScale',
            config: {
              leftLabel: 'Risk',
              rightLabel: 'Return',
              message: 'Higher potential returns typically require taking on higher risk'
            }
          }
        },
        {
          id: 'intro-3',
          type: 'text',
          content: `## The Risk-Return Relationship

One of the most important concepts in investing is the relationship between risk and return:

- **Low-risk investments** (like government bonds) generally offer lower potential returns
- **High-risk investments** (like stocks or cryptocurrency) offer higher potential returns
- Investors are compensated for taking on additional risk through the potential for higher returns
- This is known as the "risk premium" - the extra return you expect for taking on more risk

Understanding your personal risk tolerance is essential for building a portfolio that you can stick with through market ups and downs.`
        }
      ]
    },
    {
      id: 'types-of-risk',
      title: 'Types of Investment Risk',
      blocks: [
        {
          id: 'types-1',
          type: 'text',
          content: `# Common Types of Investment Risk

Investors face various types of risk. Understanding each type helps you develop targeted strategies to manage them:

## Market Risk
Also called **systematic risk**, this affects the entire market and cannot be eliminated through diversification. Examples include:
- Economic recessions
- Interest rate changes
- Political instability
- Pandemics

## Company-Specific Risk
Also called **unsystematic risk**, these are risks associated with specific investments and can be reduced through diversification:
- Poor management decisions
- Declining product demand
- Competitive pressures
- Corporate scandals`
        },
        {
          id: 'types-2',
          type: 'animation',
          content: 'Animated chart showing diversification reducing portfolio volatility',
          animation: {
            type: 'diversification',
            config: {
              message: 'Diversification reduces company-specific risk but not market risk'
            }
          }
        },
        {
          id: 'types-3',
          type: 'text',
          content: `## Other Important Risk Types

### Inflation Risk
The risk that the purchasing power of your money decreases over time due to inflation.

### Liquidity Risk
The risk of not being able to sell an investment quickly without substantial loss in value.

### Credit/Default Risk
The risk that a borrower will default on their debt obligations.

### Interest Rate Risk
The risk that changes in interest rates will negatively impact investment values.

### Currency/Exchange Rate Risk
For international investments, the risk that currency exchange rate movements will reduce returns.`
        },
        {
          id: 'types-4',
          type: 'quote',
          content: `"Risk comes from not knowing what you're doing." - Warren Buffett`
        }
      ]
    },
    {
      id: 'measuring-risk',
      title: 'Measuring and Quantifying Risk',
      blocks: [
        {
          id: 'measuring-1',
          type: 'text',
          content: `# How to Measure Investment Risk

Understanding how to quantify risk helps investors make better decisions. Here are the key metrics:

## Volatility (Standard Deviation)
- Measures how much an investment's returns fluctuate around its average return
- Higher standard deviation = more volatile = generally riskier
- Expressed as a percentage

## Beta
- Measures an investment's volatility compared to the overall market
- Market beta = 1.0
- Beta > 1: More volatile than the market
- Beta < 1: Less volatile than the market
- Example: A stock with beta of 1.5 would be expected to rise 15% when the market rises 10%, but also fall 15% when the market falls 10%`
        },
        {
          id: 'measuring-2',
          type: 'animation',
          content: 'Animation showing how beta measures market sensitivity',
          animation: {
            type: 'betaComparison',
            config: {
              highBeta: 1.5,
              lowBeta: 0.5,
              marketMovement: 10
            }
          }
        },
        {
          id: 'measuring-3',
          type: 'text',
          content: `## Real-Life Example: Tech Stocks vs. Utilities

**Tech Stock (High Beta)**
- Company: Growth Tech Inc.
- Beta: 1.8
- Behavior in bull market: When S&P 500 rises 10%, Growth Tech rises ~18%
- Behavior in bear market: When S&P 500 falls 10%, Growth Tech falls ~18%
- Perfect for: Investors with high risk tolerance seeking growth

**Utility Stock (Low Beta)**
- Company: Steady Power Co.
- Beta: 0.6
- Behavior in bull market: When S&P 500 rises 10%, Steady Power rises ~6%
- Behavior in bear market: When S&P 500 falls 10%, Steady Power falls ~6%
- Perfect for: Conservative investors seeking stability

## Other Risk Measures
- **Maximum Drawdown**: The largest peak-to-trough decline in value
- **Sharpe Ratio**: Measures risk-adjusted return (higher is better)
- **Value at Risk (VaR)**: Estimates the potential loss over a specific time period at a given confidence level`
        }
      ]
    },
    {
      id: 'risk-management-strategies',
      title: 'Effective Risk Management Strategies',
      blocks: [
        {
          id: 'strategies-1',
          type: 'text',
          content: `# Practical Risk Management Strategies

Now that we understand risk types and measurements, let's explore practical strategies to manage investment risk:

## 1. Diversification
- Spread investments across different asset classes (stocks, bonds, real estate)
- Diversify within asset classes (different sectors, geographies, company sizes)
- The goal is to create a portfolio where components don't all move together
- **Real Example**: A portfolio with 60% US stocks, 20% international stocks, 15% bonds, and 5% cash will typically have lower volatility than 100% stocks`
        },
        {
          id: 'strategies-2',
          type: 'animation',
          content: 'Animation of diversified portfolio vs. concentrated portfolio during market downturn',
          animation: {
            type: 'portfolioComparison',
            config: {
              diversified: {
                allocation: [
                  { name: 'US Stocks', percentage: 60 },
                  { name: 'Int\'l Stocks', percentage: 20 },
                  { name: 'Bonds', percentage: 15 },
                  { name: 'Cash', percentage: 5 }
                ],
                downturnImpact: -20
              },
              concentrated: {
                allocation: [
                  { name: 'Tech Stocks', percentage: 100 }
                ],
                downturnImpact: -40
              }
            }
          }
        },
        {
          id: 'strategies-3',
          type: 'text',
          content: `## 2. Asset Allocation
- Determine the right mix of stocks, bonds, cash, and other assets based on:
  - Your time horizon
  - Risk tolerance
  - Financial goals
- Generally, younger investors with longer time horizons can afford more risk
- As you approach goals (like retirement), gradually shift to more conservative allocations

## 3. Position Sizing
- Don't put too much of your portfolio in any single investment
- A common rule of thumb: No single stock should be more than 5% of your portfolio
- Example: Instead of investing ₹50,000 in a single stock, spread it across 10 stocks with ₹5,000 each

## 4. Stop-Loss Orders
- Set predetermined price points at which you'll sell to limit potential losses
- Example: Setting a 15% stop-loss means you'll sell if the investment drops 15% from purchase price
- Prevents emotional decision-making during market declines

## 5. Dollar-Cost Averaging
- Invest fixed amounts at regular intervals regardless of market conditions
- Reduces the impact of volatility and market timing risk
- Example: Investing ₹10,000 monthly in an index fund rather than ₹120,000 all at once`
        },
        {
          id: 'strategies-4',
          type: 'quote',
          content: `"The essence of investment management is the management of risks, not the management of returns." - Benjamin Graham`
        }
      ]
    },
    {
      id: 'risk-tolerance',
      title: 'Understanding Your Risk Tolerance',
      blocks: [
        {
          id: 'tolerance-1',
          type: 'text',
          content: `# Assessing Your Personal Risk Tolerance

Risk tolerance is your ability and willingness to endure declines in your investment value. It's influenced by:

- **Time Horizon**: How long until you need the money
- **Financial Situation**: Your income stability, emergency savings, etc.
- **Emotional Comfort**: Your psychological ability to handle market volatility
- **Financial Knowledge**: Your understanding of investment principles

## Risk Tolerance Self-Assessment

Ask yourself these questions:
1. How would you react if your portfolio dropped 20% in a month?
2. Would you be forced to sell investments if you lost your income?
3. Do market fluctuations keep you awake at night?
4. Are you investing for goals 5+ years away?

## Risk Tolerance Profiles

**Conservative**
- Primary concern: Preserving capital
- Comfortable with: Low returns in exchange for stability
- Typical allocation: Heavier in bonds, cash, and stable dividend stocks
- Reaction to market drop: Anxious, considering moving to cash

**Moderate**
- Primary concern: Balancing growth and stability
- Comfortable with: Some fluctuations for better long-term returns
- Typical allocation: Balanced mix of stocks and bonds
- Reaction to market drop: Concerned but understands markets recover

**Aggressive**
- Primary concern: Maximizing long-term growth
- Comfortable with: Significant short-term volatility
- Typical allocation: Primarily stocks, possibly some alternative investments
- Reaction to market drop: Sees buying opportunity`
        },
        {
          id: 'tolerance-2',
          type: 'animation',
          content: 'Animation showing different portfolio allocations based on risk profile',
          animation: {
            type: 'riskProfiles',
            config: {
              profiles: [
                {
                  name: 'Conservative',
                  allocation: [
                    { type: 'Stocks', percentage: 30 },
                    { type: 'Bonds', percentage: 50 },
                    { type: 'Cash', percentage: 20 }
                  ]
                },
                {
                  name: 'Moderate',
                  allocation: [
                    { type: 'Stocks', percentage: 60 },
                    { type: 'Bonds', percentage: 35 },
                    { type: 'Cash', percentage: 5 }
                  ]
                },
                {
                  name: 'Aggressive',
                  allocation: [
                    { type: 'Stocks', percentage: 85 },
                    { type: 'Bonds', percentage: 10 },
                    { type: 'Cash', percentage: 5 }
                  ]
                }
              ]
            }
          }
        },
        {
          id: 'tolerance-3',
          type: 'text',
          content: `## Real-Life Example: The 2020 COVID-19 Market Crash

During February-March 2020, markets dropped approximately 35% in just a few weeks due to the COVID-19 pandemic.

**How different investors responded:**

**Conservative Investor Priya:**
- Had a 40/60 stock/bond allocation
- Portfolio dropped about 15%
- Felt anxious and moved more to cash
- Missed part of the recovery
- Lesson: Her allocation didn't match her true risk tolerance

**Moderate Investor Rahul:**
- Had a 60/40 stock/bond allocation
- Portfolio dropped about 20%
- Felt uncomfortable but didn't sell
- Recovered within a year
- Lesson: His allocation matched his risk tolerance

**Aggressive Investor Arjun:**
- Had a 90/10 stock/bond allocation
- Portfolio dropped about 30%
- Viewed it as an opportunity and invested more
- Saw substantial gains in the recovery
- Lesson: His high risk tolerance allowed him to benefit from the volatility

The key insight: Your portfolio should be designed so you can stick with it during market downturns.`
        }
      ]
    }
  ],
  quizzes: {
    '25': {
      id: 'risk-basics-q1',
      title: 'Quiz 1: Understanding Risk Fundamentals',
      description: 'Test your knowledge of basic risk concepts and the risk-return relationship.',
      questions: [
        {
          id: 'q1-1',
          question: 'What is the relationship between risk and potential returns in investing?',
          options: [
            { id: 'q1-1-a', text: 'Lower risk investments typically offer higher potential returns', isCorrect: false },
            { id: 'q1-1-b', text: 'Higher risk investments typically offer higher potential returns', isCorrect: true },
            { id: 'q1-1-c', text: 'Risk and return have no relationship to each other', isCorrect: false },
            { id: 'q1-1-d', text: 'All investments have the same risk-return profile', isCorrect: false }
          ],
          explanation: 'The fundamental principle of investing is that higher potential returns require taking on higher risk. This is known as the risk premium - investors expect to be compensated for taking additional risk.'
        },
        {
          id: 'q1-2',
          question: 'Which of the following best defines "financial risk"?',
          options: [
            { id: 'q1-2-a', text: 'The certainty that you will lose money in the market', isCorrect: false },
            { id: 'q1-2-b', text: 'The potential for losing money or experiencing returns different from what was expected', isCorrect: true },
            { id: 'q1-2-c', text: 'The fees charged by financial advisors', isCorrect: false },
            { id: 'q1-2-d', text: 'The interest rate set by the central bank', isCorrect: false }
          ],
          explanation: 'Financial risk refers to the uncertainty around investment outcomes and the potential for losses or returns that differ from expectations.'
        },
        {
          id: 'q1-3',
          question: 'What is the primary goal of risk management in investing?',
          options: [
            { id: 'q1-3-a', text: 'To eliminate all risks completely', isCorrect: false },
            { id: 'q1-3-b', text: 'To maximize returns regardless of risk', isCorrect: false },
            { id: 'q1-3-c', text: 'To identify, measure, and mitigate risks while making informed decisions', isCorrect: true },
            { id: 'q1-3-d', text: 'To avoid investing in anything other than cash', isCorrect: false }
          ],
          explanation: 'Risk management isn\'t about eliminating risk (which is impossible) but about understanding risks and taking appropriate steps to mitigate them while making informed decisions based on your risk tolerance.'
        },
        {
          id: 'q1-4',
          question: 'What is the "risk premium" in investing?',
          options: [
            { id: 'q1-4-a', text: 'The monthly fee paid to a risk management consultant', isCorrect: false },
            { id: 'q1-4-b', text: 'The extra return expected for taking on additional risk', isCorrect: true },
            { id: 'q1-4-c', text: 'The insurance policy that protects against investment losses', isCorrect: false },
            { id: 'q1-4-d', text: 'The minimum investment amount required for risky assets', isCorrect: false }
          ],
          explanation: 'The risk premium is the additional return investors expect to receive for taking on more risk. For example, stocks have historically provided higher returns than bonds because they carry higher risk.'
        },
        {
          id: 'q1-5',
          question: 'According to Warren Buffett, where does risk come from?',
          options: [
            { id: 'q1-5-a', text: 'Market volatility', isCorrect: false },
            { id: 'q1-5-b', text: 'Economic recessions', isCorrect: false },
            { id: 'q1-5-c', text: 'Not knowing what you\'re doing', isCorrect: true },
            { id: 'q1-5-d', text: 'Government regulations', isCorrect: false }
          ],
          explanation: 'Warren Buffett famously said, "Risk comes from not knowing what you\'re doing." This highlights the importance of financial education and understanding your investments.'
        }
      ],
      passingScore: 80
    },
    '50': {
      id: 'risk-types-q2',
      title: 'Quiz 2: Types of Investment Risk',
      description: 'Test your understanding of different risk types and how they affect investments.',
      questions: [
        {
          id: 'q2-1',
          question: 'What is the difference between systematic risk and unsystematic risk?',
          options: [
            { id: 'q2-1-a', text: 'Systematic risk affects specific companies while unsystematic risk affects the entire market', isCorrect: false },
            { id: 'q2-1-b', text: 'Systematic risk can be eliminated through diversification while unsystematic risk cannot', isCorrect: false },
            { id: 'q2-1-c', text: 'Systematic risk affects the entire market and cannot be diversified away, while unsystematic risk is company-specific and can be reduced through diversification', isCorrect: true },
            { id: 'q2-1-d', text: 'They are different terms for the same type of risk', isCorrect: false }
          ],
          explanation: 'Systematic risk (market risk) affects the entire market and cannot be eliminated through diversification. Unsystematic risk (company-specific risk) affects individual investments and can be reduced through diversification.'
        },
        {
          id: 'q2-2',
          question: 'Which of the following is an example of market risk (systematic risk)?',
          options: [
            { id: 'q2-2-a', text: 'A company\'s CEO resigns unexpectedly', isCorrect: false },
            { id: 'q2-2-b', text: 'A company reports lower-than-expected earnings', isCorrect: false },
            { id: 'q2-2-c', text: 'A political crisis causes all market sectors to decline', isCorrect: true },
            { id: 'q2-2-d', text: 'A product recall affects a specific company\'s stock price', isCorrect: false }
          ],
          explanation: 'Market risk or systematic risk affects the entire market rather than just individual companies. Political instability is a systematic risk that impacts all sectors.'
        },
        {
          id: 'q2-3',
          question: 'What is inflation risk?',
          options: [
            { id: 'q2-3-a', text: 'The risk that a company will inflate its earnings reports', isCorrect: false },
            { id: 'q2-3-b', text: 'The risk that the purchasing power of your investment returns will decrease due to inflation', isCorrect: true },
            { id: 'q2-3-c', text: 'The risk that there will be too many investors in the market', isCorrect: false },
            { id: 'q2-3-d', text: 'The risk of investing during periods of economic growth', isCorrect: false }
          ],
          explanation: 'Inflation risk is the risk that the value of your investment returns will be eroded by inflation, reducing your real (inflation-adjusted) returns and purchasing power.'
        },
        {
          id: 'q2-4',
          question: 'What does liquidity risk refer to?',
          options: [
            { id: 'q2-4-a', text: 'The risk that you won\'t have enough cash for emergencies', isCorrect: false },
            { id: 'q2-4-b', text: 'The risk that a company will run out of cash', isCorrect: false },
            { id: 'q2-4-c', text: 'The risk of investing in water utility companies', isCorrect: false },
            { id: 'q2-4-d', text: 'The risk of not being able to sell an investment quickly without substantial loss in value', isCorrect: true }
          ],
          explanation: 'Liquidity risk refers to the possibility that you won\'t be able to sell an investment when you want to without taking a significant discount on its value.'
        },
        {
          id: 'q2-5',
          question: 'Which risk would be MOST relevant when investing in foreign markets?',
          options: [
            { id: 'q2-5-a', text: 'Currency or exchange rate risk', isCorrect: true },
            { id: 'q2-5-b', text: 'Inflation risk', isCorrect: false },
            { id: 'q2-5-c', text: 'Reinvestment risk', isCorrect: false },
            { id: 'q2-5-d', text: 'Concentration risk', isCorrect: false }
          ],
          explanation: 'When investing internationally, currency or exchange rate risk becomes significant as fluctuations in exchange rates can impact returns regardless of how well the actual investment performs.'
        }
      ],
      passingScore: 80
    },
    '75': {
      id: 'risk-measure-q3',
      title: 'Quiz 3: Measuring Risk and Management Strategies',
      description: 'Test your knowledge of risk measurements and effective management strategies.',
      questions: [
        {
          id: 'q3-1',
          question: 'What does a stock with a beta of 1.5 indicate?',
          options: [
            { id: 'q3-1-a', text: 'It is half as volatile as the market', isCorrect: false },
            { id: 'q3-1-b', text: 'It is 50% more volatile than the market', isCorrect: true },
            { id: 'q3-1-c', text: 'It will provide a 1.5% return', isCorrect: false },
            { id: 'q3-1-d', text: 'It has a 50% chance of losing value', isCorrect: false }
          ],
          explanation: 'Beta measures an investment\'s volatility relative to the market. A beta of 1.5 means the investment is expected to move 50% more than the market in either direction.'
        },
        {
          id: 'q3-2',
          question: 'Which risk management strategy involves investing fixed amounts at regular intervals regardless of market conditions?',
          options: [
            { id: 'q3-2-a', text: 'Diversification', isCorrect: false },
            { id: 'q3-2-b', text: 'Dollar-cost averaging', isCorrect: true },
            { id: 'q3-2-c', text: 'Stop-loss orders', isCorrect: false },
            { id: 'q3-2-d', text: 'Asset allocation', isCorrect: false }
          ],
          explanation: 'Dollar-cost averaging involves investing fixed amounts at regular intervals regardless of market prices. This reduces the impact of volatility and the risk of making poor timing decisions.'
        },
        {
          id: 'q3-3',
          question: 'What is the primary purpose of diversification as a risk management strategy?',
          options: [
            { id: 'q3-3-a', text: 'To increase returns', isCorrect: false },
            { id: 'q3-3-b', text: 'To eliminate all risk', isCorrect: false },
            { id: 'q3-3-c', text: 'To reduce company-specific risk by spreading investments across different assets', isCorrect: true },
            { id: 'q3-3-d', text: 'To avoid paying taxes on investments', isCorrect: false }
          ],
          explanation: 'Diversification aims to reduce company-specific (unsystematic) risk by spreading investments across different assets, sectors, and asset classes that don\'t all move together.'
        },
        {
          id: 'q3-4',
          question: 'What does a higher standard deviation of returns indicate about an investment?',
          options: [
            { id: 'q3-4-a', text: 'Lower risk', isCorrect: false },
            { id: 'q3-4-b', text: 'Higher average returns', isCorrect: false },
            { id: 'q3-4-c', text: 'Higher volatility and typically more risk', isCorrect: true },
            { id: 'q3-4-d', text: 'Better management', isCorrect: false }
          ],
          explanation: 'Standard deviation measures how much returns fluctuate around the average. A higher standard deviation indicates greater volatility and usually implies higher risk.'
        },
        {
          id: 'q3-5',
          question: 'What is a stop-loss order designed to do?',
          options: [
            { id: 'q3-5-a', text: 'Automatically buy more shares when prices drop', isCorrect: false },
            { id: 'q3-5-b', text: 'Limit potential losses by selling at a predetermined price point', isCorrect: true },
            { id: 'q3-5-c', text: 'Prevent you from selling investments', isCorrect: false },
            { id: 'q3-5-d', text: 'Increase your position size over time', isCorrect: false }
          ],
          explanation: 'A stop-loss order is set to sell an investment automatically when it reaches a predetermined price, limiting potential losses and removing emotional decision-making during market declines.'
        }
      ],
      passingScore: 80
    },
    '100': {
      id: 'risk-tolerance-q4',
      title: 'Quiz 4: Risk Tolerance and Real-World Application',
      description: 'Test your understanding of risk tolerance and how to apply risk management in real situations.',
      questions: [
        {
          id: 'q4-1',
          question: 'Which of the following factors influence personal risk tolerance?',
          options: [
            { id: 'q4-1-a', text: 'Time horizon, financial situation, and emotional comfort with volatility', isCorrect: true },
            { id: 'q4-1-b', text: 'Only age and income', isCorrect: false },
            { id: 'q4-1-c', text: 'Only the amount of money being invested', isCorrect: false },
            { id: 'q4-1-d', text: 'Only past investment performance', isCorrect: false }
          ],
          explanation: 'Risk tolerance is influenced by multiple factors including your time horizon (when you\'ll need the money), financial situation (income stability, emergency savings), emotional comfort with volatility, and financial knowledge.'
        },
        {
          id: 'q4-2',
          question: 'What would be most appropriate for an investor with a conservative risk profile?',
          options: [
            { id: 'q4-2-a', text: 'A portfolio of 90% stocks and 10% bonds', isCorrect: false },
            { id: 'q4-2-b', text: 'A portfolio of 30% stocks, 50% bonds, and 20% cash', isCorrect: true },
            { id: 'q4-2-c', text: 'A portfolio focused on high-growth technology stocks', isCorrect: false },
            { id: 'q4-2-d', text: 'A portfolio of cryptocurrency and speculative investments', isCorrect: false }
          ],
          explanation: 'A conservative investor prioritizes capital preservation and stability over growth. A portfolio with a lower allocation to stocks and higher allocation to bonds and cash is more appropriate for this risk profile.'
        },
        {
          id: 'q4-3',
          question: 'In the context of the 2020 COVID-19 market crash, what lesson was learned about risk tolerance?',
          options: [
            { id: 'q4-3-a', text: 'All investors should move to cash during market crashes', isCorrect: false },
            { id: 'q4-3-b', text: 'Your portfolio should be designed so you can stick with it during market downturns', isCorrect: true },
            { id: 'q4-3-c', text: 'Conservative investors always outperform during market crashes', isCorrect: false },
            { id: 'q4-3-d', text: 'Risk tolerance is irrelevant during extreme market events', isCorrect: false }
          ],
          explanation: 'The key lesson from market crashes is that your portfolio should align with your true risk tolerance so you can maintain your investment strategy during volatility rather than making emotional decisions at the worst possible time.'
        },
        {
          id: 'q4-4',
          question: 'How should asset allocation typically change as an investor approaches retirement?',
          options: [
            { id: 'q4-4-a', text: 'Become more aggressive to maximize final returns', isCorrect: false },
            { id: 'q4-4-b', text: 'Remain exactly the same regardless of age', isCorrect: false },
            { id: 'q4-4-c', text: 'Gradually become more conservative to protect capital', isCorrect: true },
            { id: 'q4-4-d', text: 'Move entirely to cash immediately upon retirement', isCorrect: false }
          ],
          explanation: 'As investors approach retirement, their time horizon shortens and their ability to recover from market downturns decreases. Therefore, gradually shifting to a more conservative allocation helps protect the capital they\'ll soon need.'
        },
        {
          id: 'q4-5',
          question: 'According to Benjamin Graham, what is the essence of investment management?',
          options: [
            { id: 'q4-5-a', text: 'Timing the market perfectly', isCorrect: false },
            { id: 'q4-5-b', text: 'Picking winning stocks', isCorrect: false },
            { id: 'q4-5-c', text: 'The management of risks, not the management of returns', isCorrect: true },
            { id: 'q4-5-d', text: 'Maximizing portfolio turnover', isCorrect: false }
          ],
          explanation: 'Benjamin Graham, known as the father of value investing, emphasized that successful investing is primarily about managing risk rather than chasing returns. This highlights the importance of risk management principles in building long-term wealth.'
        }
      ],
      passingScore: 80
    }
  }
}; 