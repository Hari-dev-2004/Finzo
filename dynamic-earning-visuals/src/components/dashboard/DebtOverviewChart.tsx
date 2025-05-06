import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Motion } from '@/components/ui/motion';
import { BarChartIcon } from 'lucide-react';

const DebtOverviewChart = ({ debt }) => {
  const data = [
    { name: 'Total Debt', value: debt },
    { name: 'Remaining', value:  debt } // Adjust based on your needs
  ];

  return (
    <Motion animation="fade-in" delay={0.6}>
      <Card className="glass-card col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartIcon className="w-5 h-5 mr-2 text-finzo-purple" />
            Debt Overview
          </CardTitle>
          <CardDescription>Total debt position</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#9b87f5" />
                  <Cell fill="#2d2d2d" />
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

export default DebtOverviewChart;