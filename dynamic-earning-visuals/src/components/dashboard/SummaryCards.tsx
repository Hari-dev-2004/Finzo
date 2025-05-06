import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, PiggyBank, Scale } from 'lucide-react';
import { Motion, MotionGroup } from '@/components/ui/motion';

const SummaryCards = ({ data }) => {
  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      <MotionGroup 
        animation="fade-in" 
        staggerDelay={0.1} 
        initialDelay={0.2}
        className="contents"
      >
        {/* Monthly Income */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-finzo-purple" />
              Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.monthly_income)}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-1 text-finzo-purple" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.monthly_expenses)}
            </div>
          </CardContent>
        </Card>

        {/* Current Savings */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <PiggyBank className="w-4 h-4 mr-1 text-finzo-purple" />
              Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.current_savings)}
            </div>
          </CardContent>
        </Card>

        {/* Current Debt */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Scale className="w-4 h-4 mr-1 text-finzo-purple" />
              Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.current_debt)}
            </div>
          </CardContent>
        </Card>
      </MotionGroup>
    </div>
  );
};

export default SummaryCards;