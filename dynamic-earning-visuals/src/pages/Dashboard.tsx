import React, { useEffect, useState } from 'react';
import { Motion } from '@/components/ui/motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SummaryCards from '@/components/dashboard/SummaryCards';
import PortfolioChart from '@/components/dashboard/PortfolioChart';
import IncomeExpensesChart from '@/components/dashboard/IncomeExpensesChart';
import RiskManagementCard from '@/components/dashboard/RiskManagementCard';
import DebtOverviewChart from '@/components/dashboard/DebtOverviewChart';
import RecommendationsTable from '@/components/dashboard/RecommendationsTable';
import axios from '@/api/axios';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  user_profile: {
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    has_completed_financial_info: boolean;
  };
  market_data: any;
  recommendations?: {
    portfolio_guidance: any;
    stocks: any[];
    mutual_funds: any[];
    investment_capacity: any;
  };
}

const Dashboard = () => {
  const [financialData, setFinancialData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch financial profile data
        const financialResponse = await axios.get('financial-profile/');
        setFinancialData(financialResponse.data);
        
        // Fetch dashboard data with recommendations
        const dashboardResponse = await axios.get('dashboard/');
        setDashboardData(dashboardResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="bg-finzo-black min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-finzo-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <Motion animation="fade-in" duration={0.6}>
          <h1 className="text-4xl font-bold mb-8 text-gradient">Financial Dashboard</h1>
        </Motion>

        {financialData && (
          <>
            <SummaryCards data={financialData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              <IncomeExpensesChart 
                income={financialData.monthly_income} 
                expenses={financialData.monthly_expenses}
              />
              <PortfolioChart
                investments={financialData.existing_investments}
                preferences={financialData.investment_preferences}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <RiskManagementCard 
                savings={financialData.current_savings}
                debt={financialData.current_debt}
                income={financialData.monthly_income}
              />
              <DebtOverviewChart debt={financialData.current_debt} />
            </div>
            
            {/* Display recommendations if available */}
            {dashboardData?.recommendations && (
              <Motion animation="fade-in" delay={0.4}>
                <RecommendationsTable 
                  recommendations={dashboardData.recommendations} 
                />
              </Motion>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;