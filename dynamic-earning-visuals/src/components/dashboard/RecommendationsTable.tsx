import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Motion } from '@/components/ui/motion';
import { TrendingUp, Briefcase, LineChart, ArrowUpDown, BarChart4, DollarSign, Wallet, X, AlertCircle, BarChart, PieChart, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from '@/api/axios';
import { Loader2 } from 'lucide-react';

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
  risk_management: string[];
}

interface RecommendationsProps {
  recommendations: {
    portfolio_guidance: {
      asset_allocation: Record<string, string>;
      equity_allocation: Record<string, string>;
      investment_strategies: string[];
    };
    stocks: StockRecommendation[];
    mutual_funds: MutualFundRecommendation[];
    investment_capacity: {
      monthly_investment_capacity: number;
      lump_sum_investment_capacity: number;
      debt_to_income_ratio: number;
      emergency_fund_status: string;
      emergency_fund_gap: number;
    };
  };
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

const RecommendationsTable: React.FC<RecommendationsProps> = ({ recommendations }) => {
  const [activeTab, setActiveTab] = useState<string>("stocks");
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [detailData, setDetailData] = useState<DetailedRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecommendationClick = async (symbol: string, type: string) => {
    setSelectedSymbol(symbol);
    setSelectedType(type);
    setDetailDialogOpen(true);
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`recommendations/details?type=${type}&symbol=${symbol}`);
      setDetailData(response.data);
    } catch (err: any) {
      console.error("Error fetching recommendation details:", err);
      setError(err.response?.data?.error || "Failed to load recommendation details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card mb-10">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-finzo-purple" />
          Personalized Recommendations
        </CardTitle>
        <CardDescription>Tailored investment suggestions based on your financial profile</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stocks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="stocks" className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="mutual-funds" className="flex items-center">
              <LineChart className="w-4 h-4 mr-2" />
              Mutual Funds
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center">
              <BarChart4 className="w-4 h-4 mr-2" />
              Portfolio Guidance
            </TabsTrigger>
            <TabsTrigger value="capacity" className="flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Investment Capacity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stocks" className="mt-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.stocks.map((stock) => (
                    <TableRow 
                      key={stock.symbol} 
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => handleRecommendationClick(stock.symbol, 'STOCKS')}
                    >
                      <TableCell className="font-medium">
                        <div>{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.company_name}</div>
                      </TableCell>
                      <TableCell>₹{stock.current_price ? stock.current_price.toLocaleString() : ((stock as any).price ? (stock as any).price.toLocaleString() : 'N/A')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          stock.recommendation === 'Strong Buy' || stock.recommendation === 'Buy'
                            ? 'bg-green-500/20 text-green-500'
                            : stock.recommendation === 'Hold'
                            ? 'bg-finzo-light-purple/20 text-finzo-light-purple'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {stock.recommendation}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          stock.risk_level === 'Low'
                            ? 'bg-green-500/20 text-green-500'
                            : stock.risk_level === 'Moderate'
                            ? 'bg-finzo-light-purple/20 text-finzo-light-purple'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {stock.risk_level}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="mutual-funds" className="mt-0">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fund Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Returns (3Y)</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.mutual_funds.map((fund, index) => (
                    <TableRow 
                      key={index} 
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => handleRecommendationClick(fund.name, 'MUTUAL_FUNDS')}
                    >
                      <TableCell className="font-medium">{fund.name}</TableCell>
                      <TableCell>{fund.category}</TableCell>
                      <TableCell>{fund.returns && fund.returns['3y'] !== undefined ? `${fund.returns['3y']}%` : 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          fund.risk_level === 'Low'
                            ? 'bg-green-500/20 text-green-500'
                            : fund.risk_level === 'Moderate'
                            ? 'bg-finzo-light-purple/20 text-finzo-light-purple'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {fund.risk_level}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="portfolio" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Suggested Asset Allocation</h3>
                <div className="grid grid-cols-2 gap-4">
                  {recommendations.portfolio_guidance && recommendations.portfolio_guidance.asset_allocation && 
                   Object.entries(recommendations.portfolio_guidance.asset_allocation).map(([asset, percentage]) => (
                    <div key={asset} className="bg-muted/10 p-3 rounded-lg">
                      <div className="text-sm text-muted-foreground">{asset}</div>
                      <div className="text-xl font-semibold">{percentage}</div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-gradient-to-r from-finzo-purple to-finzo-light-purple h-2 rounded-full" 
                          style={{ width: percentage }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Investment Strategies</h3>
                <ul className="space-y-2">
                  {recommendations.portfolio_guidance && recommendations.portfolio_guidance.investment_strategies && 
                   recommendations.portfolio_guidance.investment_strategies.map((strategy, index) => (
                    <li key={index} className="flex items-start">
                      <ArrowUpDown className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                      <span>{strategy}</span>
                    </li>
                  ))}
                  {(!recommendations.portfolio_guidance || !recommendations.portfolio_guidance.investment_strategies || 
                    recommendations.portfolio_guidance.investment_strategies.length === 0) && (
                    <li className="text-muted-foreground">No investment strategies available</li>
                  )}
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="capacity" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-finzo-purple" />
                  Monthly Investment Capacity
                </h3>
                <div className="text-3xl font-bold text-finzo-light-purple">
                  ₹{recommendations.investment_capacity && recommendations.investment_capacity.monthly_investment_capacity ? recommendations.investment_capacity.monthly_investment_capacity.toLocaleString() : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This is the recommended amount you can safely invest monthly based on your income and expenses.
                </p>
              </div>
              
              <div className="bg-muted/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-finzo-purple" />
                  Lump Sum Investment Capacity
                </h3>
                <div className="text-3xl font-bold text-finzo-light-purple">
                  ₹{recommendations.investment_capacity && recommendations.investment_capacity.lump_sum_investment_capacity ? recommendations.investment_capacity.lump_sum_investment_capacity.toLocaleString() : 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This is the amount you can invest as a one-time investment while maintaining adequate emergency funds.
                </p>
              </div>
              
              <div className="bg-muted/10 p-4 rounded-lg col-span-1 md:col-span-2">
                <h3 className="text-lg font-semibold mb-3">Emergency Fund Status</h3>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    recommendations.investment_capacity && recommendations.investment_capacity.emergency_fund_status === 'Adequate'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}>
                    {recommendations.investment_capacity && recommendations.investment_capacity.emergency_fund_status}
                  </span>
                  
                  {recommendations.investment_capacity && recommendations.investment_capacity.emergency_fund_gap > 0 && (
                    <span className="ml-4 text-sm">
                      Gap: ₹{recommendations.investment_capacity && recommendations.investment_capacity.emergency_fund_gap ? recommendations.investment_capacity.emergency_fund_gap.toLocaleString() : 'N/A'}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-sm mb-1">Debt to Income Ratio: {recommendations.investment_capacity && recommendations.investment_capacity.debt_to_income_ratio ? (recommendations.investment_capacity.debt_to_income_ratio * 100).toFixed(1) : 'N/A'}%</div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        recommendations.investment_capacity && recommendations.investment_capacity.debt_to_income_ratio > 0.4 
                          ? 'bg-red-500' 
                          : recommendations.investment_capacity && recommendations.investment_capacity.debt_to_income_ratio > 0.3
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(recommendations.investment_capacity.debt_to_income_ratio * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Detailed Recommendation Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-finzo-purple" />
              {selectedType === 'STOCKS' ? 'Stock' : 'Mutual Fund'} Recommendation Details
              <DialogClose className="ml-auto">
                <X className="w-4 h-4" />
              </DialogClose>
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of why this investment is recommended for your profile
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-finzo-purple animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
              <p className="text-center text-red-500">{error}</p>
            </div>
          ) : detailData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{detailData.symbol}</h2>
                  <p className="text-muted-foreground">{detailData.recommendation_data?.company_name || detailData.symbol}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold">₹{(detailData.recommendation_data?.price || detailData.recommendation_data?.current_price) ? 
                    (detailData.recommendation_data.price ? detailData.recommendation_data.price.toLocaleString() : 
                     (detailData.recommendation_data.current_price ? detailData.recommendation_data.current_price.toLocaleString() : 'N/A')) : 'N/A'}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    detailData.recommendation_data?.risk_level === 'Low'
                      ? 'bg-green-500/20 text-green-500'
                      : detailData.recommendation_data?.risk_level === 'Moderate'
                      ? 'bg-finzo-light-purple/20 text-finzo-light-purple'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {detailData.recommendation_data?.risk_level || 'Unknown'} Risk
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-muted/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-4 h-4 mr-2 text-finzo-purple" />
                      Profile Match Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Risk Tolerance:</p>
                        <p className="font-medium">{detailData.profile_summary.risk_tolerance.charAt(0).toUpperCase() + detailData.profile_summary.risk_tolerance.slice(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Investment Horizon:</p>
                        <p className="font-medium">{detailData.profile_summary.investment_time_horizon.charAt(0).toUpperCase() + detailData.profile_summary.investment_time_horizon.slice(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your Debt-to-Income Ratio:</p>
                        <p className="font-medium">{detailData.profile_summary.debt_to_income_ratio.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-finzo-purple" />
                      Key Recommendation Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {detailData.detailed_explanation.recommendation_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start">
                          <ArrowUpDown className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Technical Analysis</h3>
                <Card className="bg-muted/10">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {detailData.detailed_explanation.technical_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start">
                          <BarChart className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                          <span>{factor}</span>
                        </li>
                      ))}
                      {detailData.detailed_explanation.technical_factors.length === 0 && (
                        <li className="text-muted-foreground">No detailed technical analysis available</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fundamental Analysis</h3>
                <Card className="bg-muted/10">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {detailData.detailed_explanation.fundamental_factors.map((factor, idx) => (
                        <li key={idx} className="flex items-start">
                          <Briefcase className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                          <span>{factor}</span>
                        </li>
                      ))}
                      {detailData.detailed_explanation.fundamental_factors.length === 0 && (
                        <li className="text-muted-foreground">No detailed fundamental analysis available</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                <Card className="bg-muted/10">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {detailData.detailed_explanation.risk_assessment.map((assessment, idx) => (
                        <li key={idx} className="flex items-start">
                          <AlertCircle className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                          <span>{assessment}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Compatibility</h3>
                <Card className="bg-muted/10">
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      {detailData.detailed_explanation.profile_compatibility.map((compatibility, idx) => (
                        <li key={idx} className="flex items-start">
                          <TrendingDown className="w-4 h-4 mr-2 text-finzo-purple mt-1" />
                          <span>{compatibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recommendation Rationale</h3>
                <Card className="bg-muted/10">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-finzo-purple mb-2">Why This Stock?</h4>
                      <p className="text-sm text-muted-foreground">
                        {detailData.recommendation_data?.reasons?.[0] || 
                         "This stock aligns with your investment profile based on our analysis of risk and potential returns."}
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-finzo-purple mb-2">Score & Recommendation</h4>
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-muted/50 mr-3">
                          <span className="text-xl font-bold">{detailData.recommendation_data?.score || 'N/A'}</span>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              detailData.recommendation_data?.recommendation === 'Strong Buy' || detailData.recommendation_data?.recommendation === 'Buy'
                                ? 'bg-green-500/20 text-green-500'
                                : detailData.recommendation_data?.recommendation === 'Hold'
                                ? 'bg-finzo-light-purple/20 text-finzo-light-purple'
                                : 'bg-red-500/20 text-red-500'
                            }`}>
                              {detailData.recommendation_data?.recommendation || 'N/A'}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on comprehensive analysis of technical and fundamental factors
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-finzo-purple mb-2">Key Metrics</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sector:</span>
                          <span className="font-medium">{detailData.recommendation_data?.sector || 'N/A'}</span>
                        </div>
                        {detailData.recommendation_data?.fundamental_data?.['PE Ratio'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">PE Ratio:</span>
                            <span className="font-medium">{detailData.recommendation_data.fundamental_data['PE Ratio']}</span>
                          </div>
                        )}
                        {detailData.recommendation_data?.fundamental_data?.['ROE'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ROE:</span>
                            <span className="font-medium">{detailData.recommendation_data.fundamental_data['ROE']}%</span>
                          </div>
                        )}
                        {detailData.recommendation_data?.fundamental_data?.['Dividend Yield'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dividend Yield:</span>
                            <span className="font-medium">{detailData.recommendation_data.fundamental_data['Dividend Yield']}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RecommendationsTable;
