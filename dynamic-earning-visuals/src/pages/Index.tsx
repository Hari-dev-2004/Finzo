
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import EarningGraph from '@/components/EarningGraph';
import Features from '@/components/Features';
import Services from '@/components/Services';
import MobileApp from '@/components/MobileApp';
import Partners from '@/components/Partners';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    // Apply animations to chart bars when the component mounts
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach((bar, index) => {
      setTimeout(() => {
        bar.classList.add('animate-bar-grow');
      }, index * 100);
    });
  }, []);

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      <Hero />
      <EarningGraph />
      <Features />
      <Services />
      <MobileApp />
      <Partners />
      <Footer />
    </div>
  );
};

export default Index;
