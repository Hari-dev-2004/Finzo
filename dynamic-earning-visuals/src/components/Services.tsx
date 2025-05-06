
import { Motion, MotionGroup } from '@/components/ui/motion';
import { ArrowRight } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-finzo-purple">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM9.97 9.47L7.56 11.88L11 15.32L16.44 9.88L14.03 7.47L11 10.5L9.97 9.47Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Financial Advisory',
      description: 'Get personalized financial advice and recommendations tailored to your specific goals and situation.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-finzo-purple">
          <path d="M21 18V19C21 20.1 20.1 21 19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H19C20.1 3 21 3.9 21 5V6H12C10.89 6 10 6.9 10 8V16C10 17.1 10.89 18 12 18H21ZM12 16H22V8H12V16ZM16 13.5C15.17 13.5 14.5 12.83 14.5 12C14.5 11.17 15.17 10.5 16 10.5C16.83 10.5 17.5 11.17 17.5 12C17.5 12.83 16.83 13.5 16 13.5Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Smart Analysis',
      description: 'Manage all your transactions securely with our advanced payment system and real-time tracking.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-finzo-purple">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Investment Analysis',
      description: 'Analyze potential investments with our powerful tools designed to maximize returns and minimize risk.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-finzo-purple">
          <path d="M19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C16.1421 4.5 19.5 7.85786 19.5 12Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Time Saving',
      description: 'Set up automatic savings rules and watch your savings grow without any manual intervention.',
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-finzo-purple">
          <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
        </svg>
      ),
      title: 'Learning Module', 
      description: 'Monitor your credit score, receive improvement tips, and manage all your credit cards in one place.',
    },
  ];

  return (
    <section id="services" className="py-20 relative bg-finzo-black overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <Motion animation="fade-in" delay={0.2} className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
            <span className="text-finzo-purple font-medium text-sm">What We Offer</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
            Comprehensive <span className="text-gradient">Financial Services</span> for Every Need
          </h2>
          
          <p className="text-white/70 text-lg">
            Discover our range of financial services designed to help you build wealth, manage expenses, and secure your financial future.
          </p>
        </Motion>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {services.map((service, index) => (
            <Motion key={index} animation="fade-in" delay={0.3 + index * 0.1}>
              <div className="bg-finzo-dark-gray/40 backdrop-blur-sm p-6 rounded-2xl border border-white/5 h-full">
                <div className="w-14 h-14 rounded-full bg-finzo-purple/20 flex items-center justify-center mb-5">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-white/70 mb-4">{service.description}</p>
                <a href="#" className="inline-flex items-center text-finzo-purple hover:text-finzo-light-purple transition-colors group">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </Motion>
          ))}
        </div>
        
        <Motion animation="fade-in" delay={0.8} className="mt-16 text-center">
          <p className="text-white/70 text-lg mb-6">
            We have a lot of powerful services that you can get. Check for more of our available services in our product.
          </p>
          <a href="#" className="inline-flex items-center justify-center px-6 py-3 bg-finzo-purple/20 text-finzo-purple hover:bg-finzo-purple/30 rounded-full font-medium transition-colors">
            View More Services
          </a>
        </Motion>
      </div>
    </section>
  );
};

export default Services;
