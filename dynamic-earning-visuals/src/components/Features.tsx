
import { Button } from '@/components/ui/button';
import { Motion, MotionGroup } from '@/components/ui/motion';
import { CircleDollarSign, TrendingUp, DollarSign, CreditCard } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <CircleDollarSign className="h-6 w-6 text-finzo-purple" />,
      title: 'Smart Investment',
      description: 'Automatically categorize expenses and create personalized budgets that adapt to your spending habits.',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-finzo-purple" />,
      title: 'Stock Analysis',
      description: 'Monitor the performance of your investments across multiple accounts and asset classes in real-time.',
    },
    {
      icon: <DollarSign className="h-6 w-6 text-finzo-purple" />,
      title: 'Financial Goals',
      description: 'Set savings targets, track your progress, and receive recommendations to help you achieve your goals faster.',
    },
    {
      icon: <CreditCard className="h-6 w-6 text-finzo-purple" />,
      title: 'Expense Analysis',
      description: 'Visualize spending patterns and identify opportunities to save with AI-powered insights.',
    },
  ];

  return (
    <section id="features" className="py-20 relative bg-gradient-to-b from-finzo-black to-finzo-dark-gray overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_right,#9b87f520,transparent_40%)]"></div>
      
      <div className="container relative mx-auto px-4 md:px-6 z-10">
        <Motion animation="fade-in" delay={0.2} className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-4 px-4 py-2 bg-finzo-purple/10 backdrop-blur-sm rounded-full border border-finzo-purple/20 inline-flex items-center">
            <span className="text-finzo-purple font-medium text-sm">Powerful Features</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
            Cutting-Edge Financial <span className="text-gradient">Tools</span> at Your Fingertips
          </h2>
          
          <p className="text-white/70 text-lg">
            Finzo combines powerful financial analytics with intuitive design to give you complete control over your financial life.
          </p>
        </Motion>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {features.map((feature, index) => (
            <Motion key={index} animation="scale-in" delay={0.3 + index * 0.1}>
              <div className="glass-card p-6 h-full hover-scale transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-finzo-purple/20 flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            </Motion>
          ))}
        </div>
        
        <Motion animation="fade-in" delay={0.7} className="mt-16 glass-card p-8 purple-glow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-finzo-purple/20 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Transform Your Financial Journey?
              </h3>
              <p className="text-white/70 text-lg">
                Join thousands of users who have already taken control of their finances with Finzo's intelligent platform.
              </p>
            </div>
            
            <Button className="bg-finzo-purple hover:bg-finzo-dark-purple text-white rounded-full px-8 py-6 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-finzo-purple/20 text-lg whitespace-nowrap">
              Get Started Today
            </Button>
          </div>
        </Motion>
      </div>
    </section>
  );
};

export default Features;
