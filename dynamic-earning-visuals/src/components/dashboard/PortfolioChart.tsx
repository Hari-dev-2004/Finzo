import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Motion } from '@/components/ui/motion';
import { PieChartIcon } from 'lucide-react';

interface PortfolioChartProps {
  investments: number;
  preferences: string[];
}

const PortfolioChart = ({ investments, preferences }: PortfolioChartProps) => {
  // Generate portfolio data based on preferences
  const portfolioData = preferences.map((preference) => {
    switch (preference) {
      case 'stocks':
        return { name: 'Stocks', value: investments * 0.45, color: '#9b87f5' };
      case 'bonds':
        return { name: 'Bonds', value: investments * 0.20, color: '#7E69AB' };
      case 'real_estate':
        return { name: 'Real Estate', value: investments * 0.15, color: '#D6BCFA' };
      case 'crypto':
        return { name: 'Crypto', value: investments * 0.10, color: '#6E59A5' };
      default:
        return { name: 'Other', value: investments * 0.10, color: '#4C3D8B' };
    }
  });

  return (
    <Motion animation="fade-in" delay={0.3}>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="w-5 h-5 mr-2 text-finzo-purple" />
            Portfolio Diversification
          </CardTitle>
          <CardDescription>Asset allocation breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Motion>
  );
};

export default PortfolioChart;