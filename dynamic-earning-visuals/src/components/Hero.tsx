
import { Button } from '@/components/ui/button';
import { Motion, MotionGroup } from '@/components/ui/motion';
import { ArrowRight, CircleDollarSign, TrendingUp } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen pt-28 pb-20 overflow-hidden bg-finzo-black">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-finzo-purple/10 to-transparent" />
      
      {/* Animated background elements */}
      <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-finzo-purple/20 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-[5%] w-80 h-80 rounded-full bg-finzo-purple/10 blur-3xl animate-pulse-slow" />
      
      <div className="container relative mx-auto px-4 md:px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Motion animation="fade-in" delay={0.2} className="flex flex-col items-start">
            <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
              <span className="text-finzo-purple font-medium text-sm">Smart Financial Advisor</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Manage Your <span className="text-gradient">Finances</span> With Intelligence
            </h1>
            
            <p className="text-white/70 text-lg md:text-xl mb-8 max-w-lg">
              Take control of your financial journey with Finzo - the intelligent advisor that helps you learn, earn, and grow your wealth.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button className="bg-finzo-purple hover:bg-finzo-dark-purple text-white rounded-full px-8 py-6 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-finzo-purple/20 text-lg flex items-center gap-2">
                Get Started <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" className="bg-transparent hover:bg-white/5 text-white border-white/20 rounded-full px-8 py-6 font-medium transition-all duration-300 hover:border-white/40 text-lg">
                Learn More
              </Button>
            </div>
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-6">
              <MotionGroup animation="fade-in" staggerDelay={0.1} initialDelay={0.6} className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-finzo-purple/20">
                    <TrendingUp className="h-5 w-5 text-finzo-purple" />
                  </div>
                  <span className="text-white font-semibold">20%</span>
                </div>
                <p className="text-white/60 text-sm">Extra Return</p>
              </MotionGroup>
              
              <MotionGroup animation="fade-in" staggerDelay={0.1} initialDelay={0.7} className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-finzo-purple/20">
                    <CircleDollarSign className="h-5 w-5 text-finzo-purple" />
                  </div>
                  <span className="text-white font-semibold">2000+</span>
                </div>
                <p className="text-white/60 text-sm">Stocks Analysis</p>
              </MotionGroup>
              
              <MotionGroup animation="fade-in" staggerDelay={0.1} initialDelay={0.8} className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-finzo-purple/20">
                    <svg className="h-5 w-5 text-finzo-purple" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
                      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" fill="currentColor"/>
                    </svg>
                  </div>
                  <span className="text-white font-semibold">24/7</span>
                </div>
                <p className="text-white/60 text-sm">Available</p>
              </MotionGroup>
            </div>
          </Motion>
          
          <Motion animation="slide-in-right" delay={0.5} className="relative">
            <div className="relative z-10 mx-auto lg:ml-auto">
              <div className="relative w-full max-w-md mx-auto">
                <div className="relative bg-finzo-dark-gray/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 purple-glow float-animation">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-white">Dashboard</h3>
                    <div className="flex gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-white/60 text-sm mb-2">Total Balance</p>
                    <h2 className="text-4xl font-bold text-white mb-1"> ₹34,567.89</h2>
                    <div className="flex items-center text-green-400 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+₹2,345 (7.8%) this month</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-white font-medium">Spending Analytics</h4>
                      <select className="bg-transparent text-white/60 text-sm border-none outline-none cursor-pointer">
                        <option className="bg-finzo-dark-gray">Last 6 months</option>
                      </select>
                    </div>
                    
                    <div className="chart-bars">
                      <div className="chart-bar" style={{ "--bar-height": "60%" } as React.CSSProperties}></div>
                      <div className="chart-bar" style={{ "--bar-height": "85%" } as React.CSSProperties}></div>
                      <div className="chart-bar" style={{ "--bar-height": "45%" } as React.CSSProperties}></div>
                      <div className="chart-bar" style={{ "--bar-height": "75%" } as React.CSSProperties}></div>
                      <div className="chart-bar" style={{ "--bar-height": "55%" } as React.CSSProperties}></div>
                      <div className="chart-bar" style={{ "--bar-height": "90%" } as React.CSSProperties}></div>
                    </div>
                    
                    <div className="flex justify-between text-white/60 text-xs mt-2">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Subscriptions</p>
                          <p className="text-white/60 text-xs">2 payments</p>
                        </div>
                      </div>
                      <span className="text-white font-medium">- ₹234.56</span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">Investments</p>
                          <p className="text-white/60 text-xs">3 transactions</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-medium">+ ₹678.90</span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-finzo-purple blur-xl opacity-50"></div>
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-finzo-purple/50 blur-xl opacity-30"></div>
              </div>
            </div>
          </Motion>
        </div>
      </div>
    </section>
  );
};

export default Hero;
