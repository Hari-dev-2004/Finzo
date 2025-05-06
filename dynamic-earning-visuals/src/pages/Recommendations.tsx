import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/ui/motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from '@/api/axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PieChart, DollarSign, LineChart, BarChart2, Check, TrendingUp, User, Percent, AlertCircle, Info, HelpCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StockRecommendation {
  symbol: string;
  company_name: string;
  current_price: number;
  price?: number;
  score: number;
  recommendation: string;
  risk_level: string;
  key_signals?: {
    fundamental: string[];
    technical: string[];
    sentiment: string[];
  };
  risk_management?: string[];
  reasons?: string[];
  sector?: string;
  fundamental_data?: Record<string, any>;
  technical_indicators?: Record<string, any>;
}

interface MutualFundRecommendation {
  name: string;
  category: string;
  risk_level: string;
  expense_ratio: number;
  returns: {
    '1y'?: number;
    '3y'?: number;
    '5y'?: number;
  };
  recommendation: string;
  risk_management?: string[];
}

interface DetailedRecommendation {
  symbol: string;
  recommendation_type: string;
  recommendation_data: any;
  profile_summary: {
    risk_tolerance: string;
    investment_time_horizon: string;
    monthly_income: number;
    monthly_expenses: number;
    current_savings: number;
    current_debt: number;
    monthly_savings_capacity: number;
    debt_to_income_ratio: number;
  };
  detailed_explanation: {
    profile_match: {
      risk_tolerance: string;
      investment_horizon: string;
      savings_capacity: number;
      debt_situation: string;
    };
    recommendation_factors: string[];
    technical_factors: string[];
    fundamental_factors: string[];
    risk_assessment: string[];
    profile_compatibility: string[];
  };
}

const Recommendations = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("stocks");
  const [recommendations, setRecommendations] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<DetailedRecommendation | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Change the endpoint to match what's working on the dashboard
        const response = await axios.get('/dashboard/');
        if (response.data && response.data.recommendations) {
          setRecommendations(response.data.recommendations);
        } else {
          console.error('No recommendations found in dashboard response');
          setError('Failed to load recommendations data');
        }
      } catch (err: any) {
        console.error('Error fetching recommendations:', err);
        setError(err.response?.data?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const fetchRecommendationDetails = async (symbol: string, type: string) => {
    try {
      setDetailsLoading(true);
      
      // Use the new dedicated endpoint we added to the backend
      // This endpoint is specifically for the Recommendations page
      const response = await axios.get(`/dashboard/recommendation-details?type=${type}&symbol=${symbol}`);
      
      setSelectedRecommendation(response.data);
      setDetailDialogOpen(true);
    } catch (err: any) {
      console.error('Error fetching recommendation details:', err);
      // You could show an error toast here
    } finally {
      setDetailsLoading(false);
    }
  };

  const renderStockTab = () => {
    // Check if recommendations.stocks exists, is an array, and has items
    if (!recommendations?.stocks || !Array.isArray(recommendations.stocks) || recommendations.stocks.length === 0) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Stock Recommendations</AlertTitle>
          <AlertDescription>
            We don't have any stock recommendations for you at the moment.
            This could be because your financial profile is still being analyzed or there was an issue with the data format.
          </AlertDescription>
        </Alert>
      );
    }

    // Ensure stocks is an array before mapping
    const stocksArray = Array.isArray(recommendations.stocks) ? recommendations.stocks : [];

    return (
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-finzo-purple" />
            Stock Recommendations
          </CardTitle>
          <CardDescription>
            These stocks are selected based on technical analysis, fundamental factors, and your risk profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocksArray.map((stock: StockRecommendation) => (
                  <TableRow 
                    key={stock.symbol} 
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => fetchRecommendationDetails(stock.symbol, 'STOCKS')}
                  >
                    <TableCell className="font-medium">
                      <div>{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground">{stock.company_name}</div>
                    </TableCell>
                    <TableCell>{stock.sector || 'N/A'}</TableCell>
                    <TableCell>₹{stock.current_price ? stock.current_price.toLocaleString() : ((stock as any).price ? (stock as any).price.toLocaleString() : 'N/A')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        stock.recommendation === 'Strong Buy' || stock.recommendation === 'Buy' 
                          ? 'default' 
                          : stock.recommendation === 'Hold' 
                          ? 'secondary' 
                          : 'destructive'
                      }>
                        {stock.recommendation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        stock.risk_level === 'Low' 
                          ? 'default' 
                          : stock.risk_level === 'Moderate' 
                          ? 'secondary' 
                          : 'destructive'
                      }>
                        {stock.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={stock.score} className="w-20" />
                        <span className="text-xs">{stock.score}/100</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderMutualFundsTab = () => {
    // Check if recommendations.mutual_funds exists, is an array, and has items
    if (!recommendations?.mutual_funds || !Array.isArray(recommendations.mutual_funds) || recommendations.mutual_funds.length === 0) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Mutual Fund Recommendations</AlertTitle>
          <AlertDescription>
            We don't have any mutual fund recommendations for you at the moment.
            This could be because your financial profile is still being analyzed or there was an issue with the data format.
          </AlertDescription>
        </Alert>
      );
    }

    // Ensure mutual_funds is an array before mapping
    const mutualFundsArray = Array.isArray(recommendations.mutual_funds) ? recommendations.mutual_funds : [];

    return (
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <LineChart className="w-5 h-5 mr-2 text-finzo-purple" />
            Mutual Fund Recommendations
          </CardTitle>
          <CardDescription>
            These mutual funds are selected based on your risk profile and investment goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Expense Ratio</TableHead>
                  <TableHead>Returns (3Y)</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mutualFundsArray.map((fund: MutualFundRecommendation) => (
                  <TableRow 
                    key={fund.name} 
                    className="hover:bg-muted/20 cursor-pointer"
                    onClick={() => fetchRecommendationDetails(fund.name, 'MUTUAL_FUNDS')}
                  >
                    <TableCell className="font-medium">{fund.name}</TableCell>
                    <TableCell>{fund.category}</TableCell>
                    <TableCell>
                      <Badge variant={
                        fund.risk_level === 'Low' 
                          ? 'default' 
                          : fund.risk_level === 'Moderate' 
                          ? 'secondary' 
                          : 'destructive'
                      }>
                        {fund.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>{fund.expense_ratio !== undefined ? `${fund.expense_ratio}%` : 'N/A'}</TableCell>
                    <TableCell>{fund.returns && fund.returns['3y'] !== undefined ? `${fund.returns['3y']}%` : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        fund.recommendation === 'Strong Buy' || fund.recommendation === 'Buy' 
                          ? 'default' 
                          : fund.recommendation === 'Hold' 
                          ? 'secondary' 
                          : 'destructive'
                      }>
                        {fund.recommendation}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  const renderPortfolioGuidanceTab = () => {
    // Check if recommendations.portfolio_guidance exists and has the expected structure
    if (!recommendations?.portfolio_guidance || !recommendations.portfolio_guidance.asset_allocation || !recommendations.portfolio_guidance.equity_allocation || !recommendations.portfolio_guidance.investment_strategies) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Portfolio Guidance Available</AlertTitle>
          <AlertDescription>
            We don't have portfolio guidance for you at the moment.
            This could be because your financial profile is still being analyzed or there was an issue with the data format.
          </AlertDescription>
        </Alert>
      );
    }

    const { asset_allocation, equity_allocation, investment_strategies } = recommendations.portfolio_guidance;
    
    // Ensure investment_strategies is an array
    const strategiesArray = Array.isArray(investment_strategies) ? investment_strategies : [];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-finzo-purple" />
              Asset Allocation
            </CardTitle>
            <CardDescription>
              Recommended breakdown of your investment portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(asset_allocation).map(([asset, percentage]) => (
                <div key={asset} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{asset}</span>
                    <span className="text-sm text-muted-foreground">{String(percentage)}</span>
                  </div>
                  <Progress value={typeof percentage === 'string' ? parseInt(percentage) : 0} />
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <h3 className="text-lg font-semibold mb-3">Equity Breakdown</h3>
            <div className="space-y-4">
              {Object.entries(equity_allocation).map(([category, percentage]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground">{String(percentage)}</span>
                  </div>
                  <Progress value={typeof percentage === 'string' ? parseInt(percentage) : 0} className="bg-muted/30" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-finzo-purple" />
              Investment Strategies
            </CardTitle>
            <CardDescription>
              Recommended strategies based on your financial profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {strategiesArray.map((strategy, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{strategy}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCapacityTab = () => {
    // Check if recommendations.investment_capacity exists and has the expected structure
    if (!recommendations?.investment_capacity || !recommendations.investment_capacity.monthly_investment_capacity || !recommendations.investment_capacity.lump_sum_investment_capacity || !recommendations.investment_capacity.debt_to_income_ratio || !recommendations.investment_capacity.emergency_fund_status) {
      return (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Investment Capacity Analysis</AlertTitle>
          <AlertDescription>
            We don't have investment capacity analysis for you at the moment.
            This could be because your financial profile is still being analyzed or there was an issue with the data format.
          </AlertDescription>
        </Alert>
      );
    }

    const { 
      monthly_investment_capacity, 
      lump_sum_investment_capacity, 
      debt_to_income_ratio, 
      emergency_fund_status,
      emergency_fund_gap
    } = recommendations.investment_capacity;

    return (
      <Card className="glass-card mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-finzo-purple" />
            Investment Capacity Analysis
          </CardTitle>
          <CardDescription>
            Analysis of your current financial situation and investment capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Monthly Investment Capacity</h3>
                <div className="text-3xl font-bold">₹{monthly_investment_capacity?.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended monthly investment based on your income and expenses
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Lump Sum Investment Capacity</h3>
                <div className="text-3xl font-bold">₹{lump_sum_investment_capacity?.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended one-time investment based on your current savings
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Debt-to-Income Ratio</h3>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{debt_to_income_ratio?.toFixed(1)}%</div>
                  <Badge variant={
                    debt_to_income_ratio < 30 
                      ? 'default' 
                      : debt_to_income_ratio < 40 
                      ? 'secondary' 
                      : 'destructive'
                  } className="mb-1">
                    {debt_to_income_ratio < 30 
                      ? 'Healthy' 
                      : debt_to_income_ratio < 40 
                      ? 'Moderate' 
                      : 'High'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {debt_to_income_ratio < 30 
                    ? 'Your debt level is manageable relative to your income' 
                    : debt_to_income_ratio < 40 
                    ? 'Your debt level is somewhat high relative to your income' 
                    : 'Your debt level is high relative to your income - consider reducing debt'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Emergency Fund Status</h3>
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{emergency_fund_status}</div>
                </div>
                {emergency_fund_gap > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Recommended additional emergency savings: ₹{emergency_fund_gap.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailDialog = () => {
    if (!selectedRecommendation) return null;
    
    const {
      symbol,
      recommendation_type,
      recommendation_data,
      profile_summary,
      detailed_explanation
    } = selectedRecommendation;
    
    return (
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              {recommendation_type === 'STOCKS' ? (
                <>
                  <TrendingUp className="w-5 h-5 mr-2 text-finzo-purple" />
                  {symbol} - {recommendation_data.company_name || recommendation_data.name}
                </>
              ) : (
                <>
                  <LineChart className="w-5 h-5 mr-2 text-finzo-purple" />
                  {recommendation_data.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed analysis and personalized recommendation information
            </DialogDescription>
          </DialogHeader>
          
          {detailsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Summary section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-finzo-purple" />
                    Recommendation Summary
                  </h3>
                  <div className="space-y-3">
                    {recommendation_type === 'STOCKS' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Current Price:</span>
                          <span className="font-medium">₹{recommendation_data.current_price || recommendation_data.price || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sector:</span>
                          <span className="font-medium">{recommendation_data.sector || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Risk Level:</span>
                          <Badge variant={
                            recommendation_data.risk_level === 'Low' 
                              ? 'default' 
                              : recommendation_data.risk_level === 'Moderate' 
                              ? 'secondary' 
                              : 'destructive'
                          }>
                            {recommendation_data.risk_level}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Recommendation:</span>
                          <Badge variant={
                            recommendation_data.recommendation === 'Strong Buy' || recommendation_data.recommendation === 'Buy' 
                              ? 'default' 
                              : recommendation_data.recommendation === 'Hold' 
                              ? 'secondary' 
                              : 'destructive'
                          }>
                            {recommendation_data.recommendation}
                          </Badge>
                        </div>
                      </>
                    )}
                    
                    {recommendation_type === 'MUTUAL_FUNDS' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category:</span>
                          <span className="font-medium">{recommendation_data.category || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">1Y Returns:</span>
                          <span className="font-medium">{recommendation_data.returns && recommendation_data.returns['1y'] !== undefined ? `${recommendation_data.returns['1y']}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">3Y Returns:</span>
                          <span className="font-medium">{recommendation_data.returns && recommendation_data.returns['3y'] !== undefined ? `${recommendation_data.returns['3y']}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Expense Ratio:</span>
                          <span className="font-medium">{recommendation_data.expense_ratio !== undefined ? `${recommendation_data.expense_ratio}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Risk Level:</span>
                          <Badge variant={
                            recommendation_data.risk_level === 'Low' 
                              ? 'default' 
                              : recommendation_data.risk_level === 'Moderate' 
                              ? 'secondary' 
                              : 'destructive'
                          }>
                            {recommendation_data.risk_level}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-finzo-purple" />
                    Your Financial Profile
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Tolerance:</span>
                      <span className="font-medium capitalize">{profile_summary.risk_tolerance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investment Horizon:</span>
                      <span className="font-medium capitalize">{profile_summary.investment_time_horizon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Savings:</span>
                      <span className="font-medium">₹{profile_summary.monthly_savings_capacity.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Debt-to-Income:</span>
                      <Badge variant={
                        profile_summary.debt_to_income_ratio < 30 
                          ? 'default' 
                          : profile_summary.debt_to_income_ratio < 40 
                          ? 'secondary' 
                          : 'destructive'
                      }>
                        {profile_summary.debt_to_income_ratio.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Detailed Analysis */}
              <Accordion type="single" collapsible defaultValue="recommendation-factors">
                <AccordionItem value="recommendation-factors">
                  <AccordionTrigger className="text-lg font-semibold">
                    Why We Recommend This
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {detailed_explanation.recommendation_factors.map((factor, index) => (
                        <li key={index} className="flex items-start">
                          <ArrowRight className="w-4 h-4 mr-2 text-finzo-purple flex-shrink-0 mt-1" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                {recommendation_type === 'STOCKS' && (
                  <>
                    <AccordionItem value="technical-factors">
                      <AccordionTrigger className="text-lg font-semibold">
                        Technical Analysis
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {detailed_explanation.technical_factors.map((factor, index) => (
                            <li key={index} className="flex items-start">
                              <BarChart2 className="w-4 h-4 mr-2 text-finzo-purple flex-shrink-0 mt-1" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="fundamental-factors">
                      <AccordionTrigger className="text-lg font-semibold">
                        Fundamental Analysis
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {detailed_explanation.fundamental_factors.map((factor, index) => (
                            <li key={index} className="flex items-start">
                              <DollarSign className="w-4 h-4 mr-2 text-finzo-purple flex-shrink-0 mt-1" />
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </>
                )}
                
                <AccordionItem value="risk-assessment">
                  <AccordionTrigger className="text-lg font-semibold">
                    Risk Assessment
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {detailed_explanation.risk_assessment.map((assessment, index) => (
                        <li key={index} className="flex items-start">
                          <AlertCircle className="w-4 h-4 mr-2 text-finzo-purple flex-shrink-0 mt-1" />
                          <span>{assessment}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="profile-compatibility">
                  <AccordionTrigger className="text-lg font-semibold">
                    Compatibility with Your Profile
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {detailed_explanation.profile_compatibility.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <HelpCircle className="w-4 h-4 mr-2 text-finzo-purple flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {recommendation_type === 'STOCKS' && recommendation_data.detailed_analysis && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">Additional Technical Data</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(recommendation_data.detailed_analysis).map(([key, value]: [string, any]) => {
                      if (typeof value === 'object' || key === 'signals' || key === 'recommendation') return null;
                      return (
                        <div key={key} className="bg-muted/10 p-3 rounded-lg">
                          <div className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                          <div className="font-medium">
                            {typeof value === 'number' ? 
                              (key.includes('percent') || key.includes('change') || key.includes('ratio') ? 
                                `${value.toFixed(2)}%` : value.toLocaleString()) : 
                              String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10 flex justify-center items-center min-h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-finzo-purple mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">Loading your recommendations...</h2>
            <p className="text-muted-foreground">We're analyzing your financial profile to provide personalized insights.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-finzo-black min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <Motion animation="fade-in" duration={0.6}>
            <h1 className="text-4xl font-bold mb-8 text-gradient">Investment Recommendations</h1>
          </Motion>
          
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Recommendations</AlertTitle>
            <AlertDescription>
              {error}. Please try again later or contact support if the issue persists.
            </AlertDescription>
          </Alert>
          
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <Motion animation="fade-in" duration={0.6}>
          <h1 className="text-4xl font-bold mb-2 text-gradient">Investment Recommendations</h1>
          <p className="text-muted-foreground mb-8">Personalized investment suggestions based on your financial profile and market analysis</p>
        </Motion>
        
        <Tabs defaultValue="stocks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="stocks" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="mutual-funds" className="flex items-center">
              <LineChart className="w-4 h-4 mr-2" />
              Mutual Funds
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center">
              <PieChart className="w-4 h-4 mr-2" />
              Portfolio Guidance
            </TabsTrigger>
            <TabsTrigger value="capacity" className="flex items-center">
              <Percent className="w-4 h-4 mr-2" />
              Investment Capacity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stocks" className="mt-0">
            {renderStockTab()}
          </TabsContent>
          
          <TabsContent value="mutual-funds" className="mt-0">
            {renderMutualFundsTab()}
          </TabsContent>
          
          <TabsContent value="portfolio" className="mt-0">
            {renderPortfolioGuidanceTab()}
          </TabsContent>
          
          <TabsContent value="capacity" className="mt-0">
            {renderCapacityTab()}
          </TabsContent>
        </Tabs>
        
        {renderDetailDialog()}
      </div>
      <Footer />
    </div>
  );
};

export default Recommendations; 