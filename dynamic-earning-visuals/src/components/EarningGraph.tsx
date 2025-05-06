import { useState, useEffect } from 'react';
import { Motion } from '@/components/ui/motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

const EarningGraph = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Generate random data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const newData = months.map((month) => ({
      name: month,
      value: Math.floor(Math.random() * 5000) + 2000,
    }));
    setData(newData);
  }, []);

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return ` ₹${(value / 1000).toFixed(1)}k`;
    }
    return ` ₹${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-finzo-dark-gray p-3 rounded-lg border border-white/10 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-finzo-purple font-bold">${payload[0].value ? payload[0].value.toLocaleString() : 'N/A'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-20 relative bg-finzo-black overflow-hidden">
      <div className="absolute top-[10%] right-[10%] w-64 h-64 rounded-full bg-finzo-purple/10 blur-3xl" />
      <div className="absolute bottom-[20%] left-[5%] w-64 h-64 rounded-full bg-finzo-purple/10 blur-3xl" />
      
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Motion animation="fade-in" delay={0.2} className="order-2 lg:order-1">
            <div 
              className="relative glass-card p-6 overflow-hidden h-[400px]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-6">Earning Analytics</h3>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data}
                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9b87f5" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#9b87f5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'rgba(255,255,255,0.6)' }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis 
                      tickFormatter={formatYAxis} 
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#9b87f5" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorGradient)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-finzo-black to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}></div>
            </div>
          </Motion>
          
          <Motion animation="fade-in" delay={0.4} className="order-1 lg:order-2">
            <div className="space-y-6">
              <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
                <span className="text-finzo-purple font-medium text-sm">Visualize Your Growth</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Track Your Financial <span className="text-gradient">Progress</span> With Advanced Analytics
              </h2>
              
              <p className="text-white/70 text-lg">
                Monitor your earnings, investments, and savings with interactive real-time charts. Identify trends, optimize your strategy, and make data-driven financial decisions.
              </p>
              
              <ul className="space-y-3">
                {[
                  'Interactive data visualization',
                  'Historical performance tracking',
                  'Predictive trend analysis',
                  'Personalized insights',
                ].map((item, index) => (
                  <Motion key={index} animation="fade-in" delay={0.6 + index * 0.1}>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-finzo-purple/20 flex items-center justify-center">
                        <svg className="h-3 w-3 text-finzo-purple" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-white/80">{item}</span>
                    </li>
                  </Motion>
                ))}
              </ul>
              
              <button className="mt-4 inline-flex items-center text-finzo-purple font-medium hover:text-finzo-light-purple transition-colors group">
                Explore More Features
                <svg className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </Motion>
        </div>
      </div>
    </section>
  );
};

export default EarningGraph;
