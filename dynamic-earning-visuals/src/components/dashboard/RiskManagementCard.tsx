import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Motion } from '@/components/ui/motion';
import { Shield } from 'lucide-react';

const RiskManagementCard = ({ savings, debt, income }) => {
  const debtToIncome = ((debt / income) * 100).toFixed(1);
  const savingsRatio = ((savings / income) * 100).toFixed(1);

  return (
    <Motion animation="fade-in" delay={0.5}>
      <Card className="glass-card col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-finzo-purple" />
            Risk Management
          </CardTitle>
          <CardDescription>Financial health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Debt/Income Ratio</div>
                <div className="text-sm text-muted-foreground">{debtToIncome}%</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full purple-gradient"
                  style={{ width: `${debtToIncome}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Savings Ratio</div>
                <div className="text-sm text-muted-foreground">{savingsRatio}%</div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="h-2.5 rounded-full purple-gradient"
                  style={{ width: `${savingsRatio}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Motion>
  );
};

export default RiskManagementCard;