import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import LearningModule from '@/components/learn/LearningModule';
import { riskManagementModule } from '@/data/learning-modules/risk-management';
import { Award, ArrowLeft, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const RiskManagementPage: NextPage = () => {
  const router = useRouter();
  const [completed, setCompleted] = useState(false);

  // Handle module completion
  const handleModuleComplete = () => {
    setCompleted(true);
    // Save completion status to localStorage
    try {
      const savedModules = localStorage.getItem('completed-modules') || '[]';
      const completedModules = JSON.parse(savedModules);
      if (!completedModules.includes(riskManagementModule.id)) {
        completedModules.push(riskManagementModule.id);
        localStorage.setItem('completed-modules', JSON.stringify(completedModules));
      }
    } catch (error) {
      console.error('Failed to save completion status:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Risk Management | Learn | Finzo</title>
        <meta name="description" content="Learn about risk management principles and strategies for investing" />
      </Head>

      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push('/learn')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning Hub
        </Button>

        {completed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-6">
              <Award className="h-12 w-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
            <p className="text-xl text-gray-600 mb-8">
              You've completed the Risk Management learning module. 
              You now have a solid understanding of investment risk management principles.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button onClick={() => setCompleted(false)} variant="outline">
                <BookOpen className="mr-2 h-4 w-4" /> Review Module Again
              </Button>
              <Button onClick={() => router.push('/learn')}>
                Explore More Modules
              </Button>
            </div>
          </motion.div>
        ) : (
          <div>
            <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold mb-3">{riskManagementModule.title}</h1>
                  <p className="text-gray-600 mb-4">{riskManagementModule.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" /> 
                      {riskManagementModule.sections.length} Sections
                    </span>
                    <span className="mx-2">•</span>
                    <span>Estimated time: 30 mins</span>
                  </div>
                </div>
              </div>
            </Card>

            <LearningModule
              moduleId={riskManagementModule.id}
              title={riskManagementModule.title}
              sections={riskManagementModule.sections}
              onComplete={handleModuleComplete}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default RiskManagementPage; 