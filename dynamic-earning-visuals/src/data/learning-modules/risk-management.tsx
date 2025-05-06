import React from 'react';
import { motion } from 'framer-motion';
import { LearningModuleSection } from '@/components/learn/LearningModule';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Animation variants for section content
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

// Risk Profile Distribution data
const riskDistributionData = [
  { name: 'Stocks', value: 60, color: '#8884d8' },
  { name: 'Bonds', value: 25, color: '#82ca9d' },
  { name: 'Cash', value: 10, color: '#ffc658' },
  { name: 'Other', value: 5, color: '#ff8042' },
];

// Risk vs Return data
const riskReturnData = [
  { 
    name: 'Low Risk',
    "Expected Return": 4,
    "Risk (Volatility)": 2,
  },
  { 
    name: 'Medium Risk',
    "Expected Return": 8,
    "Risk (Volatility)": 5,
  },
  { 
    name: 'High Risk',
    "Expected Return": 12,
    "Risk (Volatility)": 10,
  },
  { 
    name: 'Very High Risk',
    "Expected Return": 16,
    "Risk (Volatility)": 18,
  },
];

// Risk diversification data
const diversificationData = [
  {
    name: '1 Stock',
    risk: 49.2,
  },
  {
    name: '10 Stocks',
    risk: 23.9,
  },
  {
    name: '20 Stocks',
    risk: 21.7,
  },
  {
    name: '30 Stocks',
    risk: 20.9,
  },
  {
    name: '40 Stocks',
    risk: 20.5,
  },
  {
    name: '50 Stocks',
    risk: 20.2,
  },
  {
    name: 'Market',
    risk: 19.2,
  },
];

// Create module sections
export const riskManagementModuleSections: LearningModuleSection[] = [
  {
    id: 'risk-basics',
    title: 'Understanding Risk Basics',
    content: (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="mb-4">
          Risk management is a fundamental aspect of investing. In financial terms, <strong>risk</strong> is the possibility 
          that an investment's actual return will differ from what is expected. This includes the potential of losing some 
          or all of the original investment.
        </motion.p>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          Key Types of Investment Risk
        </motion.h4>
        
        <motion.div variants={itemVariants} className="mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-semibold text-blue-800">Market Risk</p>
            <p className="text-blue-700">The risk that affects the entire market or asset class, regardless of the individual investment. For example, a recession, political turmoil, or changes in interest rates.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-semibold text-purple-800">Specific Risk</p>
            <p className="text-purple-700">Risk that affects a specific company or industry, such as management changes, new competitors, or product failures.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="font-semibold text-green-800">Liquidity Risk</p>
            <p className="text-green-700">The risk of not being able to buy or sell an investment quickly enough to prevent a loss or realize a profit.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="font-semibold text-red-800">Inflation Risk</p>
            <p className="text-red-700">The risk that the returns from an investment won't keep pace with inflation, reducing the real value of your money over time.</p>
          </div>
        </motion.div>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          Measuring Risk
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-4">
          Risk can be measured in several ways:
        </motion.p>
        
        <motion.ul variants={itemVariants} className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Volatility (Standard Deviation)</strong>: Measures how much an asset's return fluctuates from its average return over time.</li>
          <li><strong>Beta</strong>: Compares an asset's volatility to the market as a whole. A beta of 1 means the asset moves with the market, while a beta greater than 1 indicates higher volatility.</li>
          <li><strong>Sharpe Ratio</strong>: Measures risk-adjusted performance, showing the return per unit of risk.</li>
        </motion.ul>
        
        <motion.p variants={itemVariants}>
          Understanding these basic concepts of risk will help you make more informed investment decisions and develop strategies that align with your financial goals and risk tolerance.
        </motion.p>
      </motion.div>
    ),
    quiz: [
      {
        question: "What does 'risk' mean in financial terms?",
        options: [
          "The guarantee that you'll lose money",
          "The possibility that an investment's actual return will differ from what is expected",
          "The certainty of making a profit",
          "The interest rate charged by banks"
        ],
        correctAnswer: 1,
        explanation: "In financial terms, risk refers to the possibility that an investment's actual return will differ from what is expected, including the potential of losing some or all of the original investment."
      },
      {
        question: "Which of the following is NOT a common type of investment risk?",
        options: [
          "Market Risk",
          "Specific Risk",
          "Guaranteed Return Risk",
          "Liquidity Risk"
        ],
        correctAnswer: 2,
        explanation: "Guaranteed Return Risk is not a standard risk category. The common types include Market Risk, Specific Risk, Liquidity Risk, Inflation Risk, and others like Interest Rate Risk and Currency Risk."
      },
      {
        question: "What does Beta measure in risk assessment?",
        options: [
          "The average return of an investment",
          "How much an investment's return varies from its average return",
          "How an investment's volatility compares to the market as a whole",
          "The inflation rate's impact on investment returns"
        ],
        correctAnswer: 2,
        explanation: "Beta measures how an investment's volatility compares to the market as a whole. A beta of 1 means the asset moves with the market, while a beta greater than 1 indicates higher volatility."
      },
      {
        question: "What is Inflation Risk?",
        options: [
          "The risk that inflation will cause the market to crash",
          "The risk that returns from an investment won't keep pace with inflation",
          "The risk that the government will increase interest rates",
          "The risk that banks will charge higher fees during inflation"
        ],
        correctAnswer: 1,
        explanation: "Inflation Risk is the risk that the returns from an investment won't keep pace with inflation, reducing the real value of your money over time."
      },
      {
        question: "Which measure helps investors understand risk-adjusted performance?",
        options: [
          "Beta",
          "Standard Deviation",
          "Sharpe Ratio",
          "Price-to-Earnings Ratio"
        ],
        correctAnswer: 2,
        explanation: "The Sharpe Ratio measures risk-adjusted performance, showing the return per unit of risk. It helps investors understand if a higher return is due to good investment decisions or due to taking on more risk."
      }
    ]
  },
  {
    id: 'risk-tolerance',
    title: 'Risk Tolerance & Profile Assessment',
    content: (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="mb-4">
          Risk tolerance is the degree of variability in investment returns that an individual is willing to withstand. 
          Understanding your risk tolerance is crucial for creating an investment strategy that you'll be comfortable with, 
          especially during market downturns.
        </motion.p>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          Factors Affecting Risk Tolerance
        </motion.h4>
        
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="font-semibold text-amber-800">Age & Time Horizon</p>
            <p className="text-amber-700">Younger investors typically have more time to recover from market downturns and may tolerate more risk. As you approach retirement, preserving capital often becomes more important.</p>
          </div>
          
          <div className="bg-teal-50 p-4 rounded-lg">
            <p className="font-semibold text-teal-800">Financial Goals</p>
            <p className="text-teal-700">Short-term goals (like buying a house in 2 years) generally require less risky investments than long-term goals (like retirement in 30 years).</p>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="font-semibold text-indigo-800">Income & Net Worth</p>
            <p className="text-indigo-700">Higher income and net worth may allow for more risk-taking since losses may have less impact on your overall financial situation.</p>
          </div>
          
          <div className="bg-rose-50 p-4 rounded-lg">
            <p className="font-semibold text-rose-800">Emotional Temperament</p>
            <p className="text-rose-700">Some investors feel comfortable with market fluctuations, while others may lose sleep over even minor market movements.</p>
          </div>
        </motion.div>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-3">
          Risk Profiles
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-4">
          Investors typically fall into one of these risk profiles:
        </motion.p>
        
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <h5 className="font-bold">Conservative</h5>
            <p>Priority is preserving capital. Willing to accept lower returns for greater security. Typical allocation might include a higher percentage of bonds and cash equivalents.</p>
          </div>
          
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4">
            <h5 className="font-bold">Moderate</h5>
            <p>Balanced approach seeking some growth while still maintaining some security. Portfolio typically has a mix of stocks, bonds, and other assets.</p>
          </div>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <h5 className="font-bold">Aggressive</h5>
            <p>Focused on maximizing returns and willing to accept significant fluctuations. Portfolio typically has a high allocation to stocks and other growth-oriented investments.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Sample Asset Allocation Based on Risk Profile</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-center text-gray-500">Example asset allocation for a moderate risk investor</p>
        </motion.div>
        
        <motion.p variants={itemVariants}>
          Assessing your risk tolerance accurately is essential for creating an investment strategy that aligns with your 
          financial goals, time horizon, and personal comfort level. Remember that your risk tolerance may change over time 
          as your circumstances evolve.
        </motion.p>
      </motion.div>
    ),
    quiz: [
      {
        question: "What is risk tolerance?",
        options: [
          "The maximum amount of money you can invest",
          "The degree of variability in investment returns that an individual is willing to withstand",
          "The minimum return you expect from your investments",
          "The amount of debt you can handle"
        ],
        correctAnswer: 1,
        explanation: "Risk tolerance is the degree of variability in investment returns that an individual is willing to withstand. It reflects your personal comfort level with potential losses and fluctuations in your investments."
      },
      {
        question: "How does age typically affect risk tolerance?",
        options: [
          "Age has no effect on risk tolerance",
          "Older investors typically have higher risk tolerance",
          "Younger investors typically have more time to recover from market downturns and may tolerate more risk",
          "Middle-aged investors always have the highest risk tolerance"
        ],
        correctAnswer: 2,
        explanation: "Younger investors typically have more time to recover from market downturns and therefore may be able to tolerate more risk in their portfolios. As investors age, they generally shift toward more conservative allocations."
      },
      {
        question: "Which risk profile would likely have the highest allocation to bonds and cash?",
        options: [
          "Aggressive",
          "Moderate",
          "Conservative",
          "Speculative"
        ],
        correctAnswer: 2,
        explanation: "A Conservative risk profile prioritizes capital preservation over growth, and therefore typically has the highest allocation to bonds and cash equivalents, which are generally less volatile than stocks."
      },
      {
        question: "How might a short-term financial goal affect your investment approach?",
        options: [
          "It would likely lead to investing in higher-risk assets",
          "It would likely lead to investing in lower-risk assets",
          "It would have no effect on investment choices",
          "It would require avoiding all investments entirely"
        ],
        correctAnswer: 1,
        explanation: "Short-term financial goals (like buying a house in 2 years) generally require less risky investments because there is less time to recover from potential market downturns before the money is needed."
      },
      {
        question: "Which factor is NOT typically considered when assessing risk tolerance?",
        options: [
          "Your age and time horizon",
          "Your income and net worth",
          "Your political affiliation",
          "Your emotional temperament"
        ],
        correctAnswer: 2,
        explanation: "Political affiliation is not typically considered when assessing risk tolerance. The main factors include age, time horizon, financial goals, income, net worth, and emotional comfort with market fluctuations."
      }
    ]
  },
  {
    id: 'risk-reduction',
    title: 'Risk Reduction Strategies',
    content: (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="mb-4">
          While risk cannot be eliminated from investing, several strategies can help reduce it. Implementing these strategies 
          can help you build a portfolio that balances risk and potential returns in a way that aligns with your goals.
        </motion.p>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-4">
          1. Diversification
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-4">
          Diversification is one of the most powerful risk reduction strategies. By spreading investments across various asset 
          classes, industries, and geographic regions, you can reduce the impact of a poor-performing investment on your 
          overall portfolio.
        </motion.p>
        
        <motion.div variants={itemVariants} className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={diversificationData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Risk (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="risk" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-center text-gray-500">How portfolio risk decreases with diversification</p>
        </motion.div>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          2. Asset Allocation
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-6">
          Proper asset allocation involves dividing your investments among different asset categories such as stocks, bonds, 
          and cash based on your goals, risk tolerance, and time horizon. Studies have shown that asset allocation is 
          responsible for the majority of a portfolio's performance over time.
        </motion.p>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          3. Dollar-Cost Averaging
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-6">
          Dollar-cost averaging involves investing a fixed amount at regular intervals, regardless of market conditions. 
          This strategy helps reduce the impact of market volatility and removes the emotional aspect of trying to time the market.
        </motion.p>
        
        <motion.div variants={itemVariants} className="bg-amber-50 p-4 rounded-lg mb-6">
          <h5 className="font-bold mb-2">Example of Dollar-Cost Averaging</h5>
          <p>Investing ₹5,000 monthly in a mutual fund:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Month 1: Price ₹50/share = 100 shares purchased</li>
            <li>Month 2: Price ₹40/share = 125 shares purchased</li>
            <li>Month 3: Price ₹60/share = 83.3 shares purchased</li>
          </ul>
          <p className="mt-2">Total investment: ₹15,000 for 308.3 shares</p>
          <p>Average cost per share: ₹48.65</p>
          <p>Market average price: ₹50.00</p>
          <p className="font-semibold mt-2">Result: You purchased at below the average market price!</p>
        </motion.div>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          4. Rebalancing
        </motion.h4>
        
        <motion.p variants={itemVariants} className="mb-6">
          Rebalancing means periodically adjusting your portfolio to maintain your target asset allocation. When some 
          investments perform better than others, your portfolio can drift from your intended allocation. Rebalancing 
          helps maintain your desired risk level and can sometimes improve returns.
        </motion.p>
        
        <motion.h4 variants={itemVariants} className="text-lg font-semibold mt-6 mb-2">
          5. Risk vs. Return Consideration
        </motion.h4>
        
        <motion.div variants={itemVariants} className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={riskReturnData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Expected Return" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Risk (Volatility)" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-center text-gray-500">Relationship between risk and expected returns</p>
        </motion.div>
        
        <motion.p variants={itemVariants}>
          Remember that reducing risk often means accepting potentially lower returns. The key is finding the right balance 
          for your personal situation and goals. Risk management isn't about eliminating risk—it's about taking intentional, 
          calculated risks that align with your investment strategy.
        </motion.p>
      </motion.div>
    ),
    quiz: [
      {
        question: "What is diversification?",
        options: [
          "Investing all your money in a single high-performing stock",
          "Spreading investments across various asset classes, industries, and geographic regions",
          "Changing your investment strategy every month",
          "Investing only in government bonds"
        ],
        correctAnswer: 1,
        explanation: "Diversification involves spreading investments across various asset classes, industries, and geographic regions to reduce the impact of a poor-performing investment on your overall portfolio."
      },
      {
        question: "According to research, what factor is responsible for the majority of a portfolio's performance over time?",
        options: [
          "Stock picking",
          "Market timing",
          "Asset allocation",
          "Investment fees"
        ],
        correctAnswer: 2,
        explanation: "Studies have shown that asset allocation (how you divide your investments among different asset categories like stocks, bonds, and cash) is responsible for the majority of a portfolio's performance over time."
      },
      {
        question: "What is dollar-cost averaging?",
        options: [
          "Investing all your money at once when the market is low",
          "Only buying investments when they reach a specific dollar amount",
          "Investing a fixed amount at regular intervals, regardless of market conditions",
          "Converting all investments to US dollars"
        ],
        correctAnswer: 2,
        explanation: "Dollar-cost averaging involves investing a fixed amount at regular intervals, regardless of market conditions. This strategy helps reduce the impact of market volatility."
      },
      {
        question: "Why is portfolio rebalancing important?",
        options: [
          "It guarantees higher returns",
          "It eliminates all investment risk",
          "It helps maintain your desired risk level when some investments outperform others",
          "It ensures you only invest in top-performing assets"
        ],
        correctAnswer: 2,
        explanation: "Rebalancing helps maintain your desired risk level when some investments perform better than others, causing your portfolio to drift from your intended asset allocation."
      },
      {
        question: "What typically happens to expected returns as you reduce investment risk?",
        options: [
          "Expected returns typically increase",
          "Expected returns typically decrease",
          "Expected returns remain exactly the same",
          "There is no relationship between risk and expected returns"
        ],
        correctAnswer: 1,
        explanation: "Generally, reducing risk often means accepting potentially lower returns. This is known as the risk-return tradeoff, a fundamental principle in investing."
      }
    ]
  },
  {
    id: 'risk-case-studies',
    title: 'Real-Life Case Studies',
    content: (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="mb-6">
          Understanding risk management through real-life examples can help illustrate how theoretical concepts apply in 
          practice. Let's examine some case studies that demonstrate both successful risk management and the consequences 
          of poor risk management.
        </motion.p>
        
        <motion.div variants={itemVariants} className="bg-blue-50 p-6 rounded-lg mb-8">
          <h4 className="text-xl font-bold mb-3">Case Study 1: The Diversified Investor</h4>
          
          <div className="mb-4">
            <h5 className="font-semibold text-blue-800">Background</h5>
            <p>Priya, a 35-year-old IT professional, had been investing for retirement since she started working at age 25. She maintained a well-diversified portfolio with domestic and international stocks, bonds, and some alternative investments.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-blue-800">Situation</h5>
            <p>During the 2020 COVID-19 market crash, the Indian stock market fell by nearly 40% in a matter of weeks.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-blue-800">Risk Management Strategy</h5>
            <p>Because of her diversification strategy, Priya's portfolio only declined by 23% during the worst of the crash—significantly less than the broader market. Her bond allocation, gold investments, and international stocks helped buffer some of the volatility.</p>
            <p className="mt-2">In addition, Priya had been practicing dollar-cost averaging, continuing her regular monthly investments even during the market downturn. This allowed her to purchase shares at lower prices during the crash.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-blue-800">Outcome</h5>
            <p>By the end of 2020, as markets recovered, Priya's portfolio had not only regained its losses but was up 5% for the year. The shares purchased during the downturn contributed significantly to this recovery.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-blue-800">Key Lesson</h5>
            <p>Diversification and consistent investing through market cycles can significantly reduce the impact of market crashes and position investors to benefit from recovery periods.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-red-50 p-6 rounded-lg mb-8">
          <h4 className="text-xl font-bold mb-3">Case Study 2: The Concentrated Position</h4>
          
          <div className="mb-4">
            <h5 className="font-semibold text-red-800">Background</h5>
            <p>Rajesh, a 42-year-old banker, received stock options from his employer, a major private bank. Over time, these stocks came to represent 70% of his investment portfolio.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-red-800">Situation</h5>
            <p>In 2018, a major scandal involving fraudulent loan practices was uncovered at his bank. As details of the scandal emerged, the bank's stock price plummeted by 60% over several months.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-red-800">Risk Management Failure</h5>
            <p>With such a large percentage of his portfolio in his employer's stock, Rajesh's investments suffered severely. His overall portfolio lost nearly 45% of its value.</p>
            <p className="mt-2">Rajesh had failed to diversify away from his employer's stock, creating a double risk: his financial assets and employment income were tied to the same company.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-red-800">Outcome</h5>
            <p>Rajesh's retirement plans were significantly delayed. The bank's stock took several years to partially recover, but never returned to its pre-scandal levels. Rajesh was forced to work five years longer than he had originally planned.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-red-800">Key Lesson</h5>
            <p>Concentrated positions, especially in your employer's stock, create excessive risk. Even seemingly stable companies can face unexpected crises that dramatically impact their value.</p>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="bg-green-50 p-6 rounded-lg mb-8">
          <h4 className="text-xl font-bold mb-3">Case Study 3: The Rebalancing Strategy</h4>
          
          <div className="mb-4">
            <h5 className="font-semibold text-green-800">Background</h5>
            <p>Anand, a 50-year-old professor, maintained a moderate risk portfolio with a target allocation of 60% stocks and 40% bonds. He diligently rebalanced his portfolio annually.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-green-800">Situation</h5>
            <p>By the end of 2019, after several years of strong stock market performance, Anand's portfolio had drifted to 72% stocks and 28% bonds due to the outperformance of his equity holdings.</p>
            <p className="mt-2">Following his rebalancing strategy, he sold some stocks and purchased bonds to return to his target 60/40 allocation in January 2020.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-green-800">Risk Management Strategy</h5>
            <p>Just two months later, when the COVID-19 pandemic triggered a market crash, Anand's portfolio was better positioned to weather the storm due to his recent rebalancing. The higher bond allocation (40% vs. 28%) provided stability during the equity market decline.</p>
          </div>
          
          <div className="mb-4">
            <h5 className="font-semibold text-green-800">Outcome</h5>
            <p>As markets fell sharply, Anand again followed his rebalancing strategy, selling some bonds and buying stocks at reduced prices. This positioned him well for the subsequent recovery. By the end of 2020, his portfolio was up slightly for the year, outperforming many of his colleagues who had not rebalanced.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-green-800">Key Lesson</h5>
            <p>Systematic rebalancing forces investors to buy low and sell high—the essence of successful investing. It removes emotion from the process and helps maintain the intended risk level of the portfolio.</p>
          </div>
        </motion.div>
        
        <motion.p variants={itemVariants}>
          These case studies demonstrate that risk management isn't just theoretical—it has real-world implications for 
          financial outcomes. The most successful investors don't try to avoid risk entirely but rather manage it 
          thoughtfully through diversification, appropriate asset allocation, consistent investing, and regular rebalancing.
        </motion.p>
      </motion.div>
    ),
    quiz: [
      {
        question: "In Case Study 1, what strategy helped Priya's portfolio decline less than the broader market during the COVID-19 crash?",
        options: [
          "Investing all her money in gold",
          "Taking out loans to buy more stocks during the crash",
          "Diversification across different asset classes",
          "Selling all her investments before the crash"
        ],
        correctAnswer: 2,
        explanation: "Priya's diversification strategy—including bonds, gold investments, and international stocks—helped buffer some of the volatility, causing her portfolio to decline by only 23% compared to the market's 40% drop."
      },
      {
        question: "What risk management failure did Rajesh demonstrate in Case Study 2?",
        options: [
          "He invested too conservatively",
          "He had a concentrated position with 70% of his portfolio in his employer's stock",
          "He sold all his stocks during a market downturn",
          "He never invested in the stock market"
        ],
        correctAnswer: 1,
        explanation: "Rajesh had a concentrated position with 70% of his portfolio in his employer's stock, creating excessive risk. This concentration meant that both his employment income and investments were tied to the same company."
      },
      {
        question: "What risk management strategy did Anand follow in Case Study 3?",
        options: [
          "Dollar-cost averaging",
          "Market timing",
          "Regular rebalancing to maintain his target asset allocation",
          "Investing only in government bonds"
        ],
        correctAnswer: 2,
        explanation: "Anand followed a regular rebalancing strategy, adjusting his portfolio back to his target 60% stocks/40% bonds allocation annually. This proved beneficial when the market crashed shortly after his January 2020 rebalancing."
      },
      {
        question: "What principle does systematic rebalancing enforce, according to Case Study 3?",
        options: [
          "Buying high and selling low",
          "Buying low and selling high",
          "Keeping all investments constant regardless of market conditions",
          "Avoiding stocks entirely"
        ],
        correctAnswer: 1,
        explanation: "Systematic rebalancing forces investors to buy low and sell high—the essence of successful investing. It removes emotion from the process and helps maintain the intended risk level of the portfolio."
      },
      {
        question: "What common theme is demonstrated across all three case studies?",
        options: [
          "Successful investing requires predicting market crashes",
          "Bonds always outperform stocks during market crashes",
          "Risk management strategies have significant real-world impacts on financial outcomes",
          "International investments always outperform domestic investments"
        ],
        correctAnswer: 2,
        explanation: "The case studies demonstrate that risk management isn't just theoretical—it has real-world implications for financial outcomes. The most successful investors don't try to avoid risk entirely but rather manage it thoughtfully."
      }
    ]
  }
];

// Export the module data
export const riskManagementModule = {
  id: 'risk-management-basics',
  title: 'Basics of Risk Management',
  description: 'Learn the fundamental concepts of risk management in investing, including risk assessment, tolerance evaluation, and strategies to reduce and manage investment risk.',
  sections: riskManagementModuleSections,
};

export default riskManagementModule; 