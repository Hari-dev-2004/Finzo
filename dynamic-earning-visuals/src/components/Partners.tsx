
import { Motion, MotionGroup } from '@/components/ui/motion';

const Partners = () => {
  return (
    <section className="py-20 relative bg-finzo-black overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <Motion animation="fade-in" delay={0.2} className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
            <span className="text-finzo-purple font-medium text-sm">Trusted Partners</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
            We Work With the <span className="text-gradient">Best</span> in the Industry
          </h2>
          
          <p className="text-white/70 text-lg">
            Finzo partners with leading financial institutions and technology providers to deliver a seamless experience.
          </p>
        </Motion>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
          <MotionGroup animation="fade-in" staggerDelay={0.1} initialDelay={0.4} className="flex flex-col items-center justify-center">
            <div className="bg-finzo-dark-gray/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 h-24 w-full flex items-center justify-center hover-scale">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-white mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 9H20M7 3V5M17 3V5M7 11H9M12 11H14M17 11H19M7 15H9M12 15H14M17 15H19M7 19H9M12 19H14M17 19H19M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-white font-bold text-xl">Lumine</span>
              </div>
            </div>
          </MotionGroup>
          
        </div>
        
        <Motion animation="fade-in" delay={0.8} className="mt-16 p-8 rounded-3xl glass-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-finzo-purple/10 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-wrap lg:flex-nowrap items-center gap-8 justify-between">
            <div className="w-full lg:w-3/5">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Keep Updated About Our Product
              </h3>
              <p className="text-white/70">
                Subscribe to our newsletter to receive the latest updates and exclusive offers.
              </p>
            </div>
            
            <div className="w-full lg:w-2/5">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-finzo-purple"
                />
                <button className="bg-finzo-purple hover:bg-finzo-dark-purple text-white rounded-full px-6 py-3 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-finzo-purple/20">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </Motion>
      </div>
    </section>
  );
};

export default Partners;
