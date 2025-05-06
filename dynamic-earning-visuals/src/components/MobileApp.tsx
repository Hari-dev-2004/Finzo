import { Motion } from '@/components/ui/motion';

const MobileApp = () => {
  return (
    <section className="py-20 relative bg-finzo-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-finzo-purple/10 to-transparent opacity-50"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Motion animation="fade-in" delay={0.2}>
            <div className="space-y-6">
              <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
                <span className="text-finzo-purple font-medium text-sm">Mobile Experience</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Manage Everything in <span className="text-gradient">Your Hand</span>
              </h2>
              
              <p className="text-white/70 text-lg">
                Access your financial dashboard anytime, anywhere with our powerful mobile application. Track expenses, manage investments, and make informed decisions on the go.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-finzo-purple/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-finzo-purple" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M15 9.5C15 8.57174 14.6313 7.6815 13.9749 7.02513C13.3185 6.36875 12.4283 6 11.5 6C10.5717 6 9.6815 6.36875 9.02513 7.02513C8.36875 7.6815 8 8.57174 8 9.5C8 14 15 14 15 9.5Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7.5 19C8.17469 17.4346 9.3582 16.1239 10.8442 15.2493C12.3301 14.3748 14.0454 13.9788 15.75 14.1C16.7442 14.1707 17.7059 14.4682 18.5667 14.967" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">User Friendly</h3>
                    <p className="text-white/70">Intuitive interface designed for simplicity and ease of use.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-finzo-purple/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-finzo-purple" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Best Support</h3>
                    <p className="text-white/70">24/7 Available.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-finzo-purple/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-finzo-purple" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15848 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Secure</h3>
                    <p className="text-white/70">Bank-level security to keep your financial data protected.</p>
                  </div>
                </div>
              </div>
              
            
            </div>
          </Motion>
          
          <Motion animation="slide-right" delay={0.5} className="relative">
            <div className="relative z-10 mx-auto">
              <div className="relative w-full max-w-xs mx-auto">
                <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-finzo-dark-gray shadow-2xl purple-glow">
                  <img 
                    src="/lovable-uploads/a85e38fb-691a-4b8c-8fa2-9e6e47c35a2e.png" 
                    alt="Finzo Mobile App" 
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute top-0 left-0 right-0 h-6 bg-finzo-dark-gray rounded-t-lg"></div>
                </div>
                
                <div className="absolute top-0 -right-16 w-40 h-40 rounded-full bg-finzo-purple/30 blur-3xl"></div>
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-finzo-purple/20 blur-3xl"></div>
                
                <div className="absolute -right-16 md:-right-24 top-1/3 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg animate-float">
                  <div className="w-36 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-finzo-purple flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">Add New</p>
                        <p className="text-white/60 text-[10px]">Transaction</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -left-20 md:-left-28 bottom-1/4 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-28 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16 18L22 12L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">Transfer</p>
                        <p className="text-green-500 text-[10px] font-medium">+₹250</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Motion>
        </div>
      </div>
    </section>
  );
};

export default MobileApp;
