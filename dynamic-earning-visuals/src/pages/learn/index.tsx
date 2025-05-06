import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { riskManagementModule } from '@/data/learning-modules/risk-management';
import { BookOpen, Award, ChevronRight } from 'lucide-react';

// Define interface for module data
interface LearningModule {
  id: string;
  title: string;
  description: string;
  sections: any[];
}

const LearningHubPage = () => {
  const router = useRouter();
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  // List of available modules
  const availableModules: LearningModule[] = [
    riskManagementModule,
    // Add more modules here as they are created
  ];

  // Load completed modules from localStorage on component mount
  useEffect(() => {
    try {
      const savedModules = localStorage.getItem('completed-modules');
      if (savedModules) {
        setCompletedModules(JSON.parse(savedModules));
      }
    } catch (error) {
      console.error('Failed to load completed modules:', error);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Learning Hub | Finzo</title>
        <meta name="description" content="Explore financial learning modules to improve your investment knowledge" />
      </Head>

      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">Financial Learning Hub</h1>
            <p className="text-xl text-gray-600">
              Expand your financial knowledge with our interactive learning modules
            </p>
          </div>

          <div className="grid gap-6">
            {availableModules.map((module) => {
              const isCompleted = completedModules.includes(module.id);
              
              return (
                <Card 
                  key={module.id} 
                  className={`p-6 transition-all hover:shadow-md ${
                    isCompleted ? 'border-green-200 bg-green-50' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-bold">{module.title}</h2>
                        {isCompleted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Award className="w-3 h-3 mr-1" /> Completed
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{module.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" /> 
                          {module.sections.length} Sections
                        </span>
                        <span className="mx-2">•</span>
                        <span>Estimated time: 30 mins</span>
                      </div>
                      
                      <Button 
                        onClick={() => router.push(`/learn/${module.id}`)}
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {isCompleted ? 'Review Module' : 'Start Learning'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Future modules section */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Coming Soon</h2>
            
            <div className="grid gap-4">
              {['Investment Basics', 'Asset Allocation', 'Tax-Efficient Investing'].map((title) => (
                <Card key={title} className="p-6 bg-gray-50 opacity-70">
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-gray-500">This module is currently in development.</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearningHubPage; 