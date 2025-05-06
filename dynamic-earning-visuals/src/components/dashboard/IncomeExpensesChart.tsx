import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Motion } from '@/components/ui/motion';
import { TrendingUp } from 'lucide-react';

const IncomeExpensesChart = ({ income, expenses }) => {
  const chartData = [
    { name: 'Income', value: income },
    { name: 'Expenses', value: expenses }
  ];

  return (
    <Motion animation="fade-in" delay={0.4}>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-finzo-purple" />
            Income vs Expenses
          </CardTitle>
          <CardDescription>Monthly comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#9b87f5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Motion>
  );
};

export default IncomeExpensesChart;