import React, { useState, useEffect } from 'react';
import { Search, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  Line
} from 'recharts';

interface ApiResponse {
  Date?: string[];
  Datetime?: string[];
  index?: string[];
  Close: number[];
  Open?: number[];
  High?: number[];
  Low?: number[];
  Volume?: number[];
}

interface StockAnalysis {
  symbol: string;
  company_name: string;
  current_price: number;
  health_score: number;
  technical_score: number;
  fundamental_score: number;
  recommendation: string;
  entry_point: number | null;
  exit_point: number | null;
  signals: string[];
  fundamentals: Record<string, any>;
  charts: {
    priceMA: string;
    rsi: string;
    macd: string;
    bollinger: string;
  };
  news: Array<{
    title: string;
    link: string;
    date: string;
  }>;
}

interface MarketData {
  nifty: Array<{ time: string; value: number }>;
  bankNifty: Array<{ time: string; value: number }>;
  topGainers: Array<{ symbol: string; name: string; change: string; price: string; volume: string }>;
  topLosers: Array<{ symbol: string; name: string; change: string; price: string; volume: string }>;
  trendingStocks: Array<{ symbol: string; name: string; price: string; change: string; chart: Array<{ x: number; y: number }> }>;
  mutualFunds: Array<{ name: string; value: string; returns1Y: string; returns3Y: string }>;
  commodities: Array<{ name: string; price: string; change: string }>;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

interface SearchResult {
  symbol: string;
  companyName: string;
}

const ASSET_MAPPINGS = {
  mutualFunds: {
    '0P0000XVPM.BO': 'Axis Bluechip Fund',
    '0P0000YWLX.BO': 'SBI Small Cap Fund',
    '0P0000ZIMR.BO': 'HDFC Mid-Cap Opportunities'
  },
  commodities: {
    'GC=F': 'Gold',
    'CL=F': 'Crude Oil',
    'NG=F': 'Natural Gas'
  }
};

const Research = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState('stocks');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [stockAnalysis, setStockAnalysis] = useState<StockAnalysis | null>(null);
  const [marketData, setMarketData] = useState<MarketData>({
    nifty: [],
    bankNifty: [],
    topGainers: [],
    topLosers: [],
    trendingStocks: [],
    mutualFunds: [],
    commodities: []
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeChart, setActiveChart] = useState('priceMA');

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const [niftyData, bankNiftyData, moversData, stocksData] = await Promise.all([
          fetch('http://localhost:8000/api/index/?index=^NSEI&period=1d&interval=5m'),
          fetch('http://localhost:8000/api/index/?index=^NSEBANK&period=1d&interval=5m'),
          fetch('http://localhost:8000/api/market-movers/'),
          fetch('http://localhost:8000/api/random-stocks/?n=6')
        ]);

        const [nifty, bankNifty] = await Promise.all([
          niftyData.json() as Promise<ApiResponse>,
          bankNiftyData.json() as Promise<ApiResponse>
        ]);

        const movers = await moversData.json() as { gainers: [string, number, number, number][], losers: [string, number, number, number][] };
        const stocks = await stocksData.json() as Record<string, ApiResponse>;

        const [fundsResponses, commoditiesResponses] = await Promise.all([
          Promise.all(Object.keys(ASSET_MAPPINGS.mutualFunds).map(ticker => 
            fetch(`http://localhost:8000/api/mutual-fund/?ticker=${ticker}`)
          )),
          Promise.all(Object.keys(ASSET_MAPPINGS.commodities).map(ticker => 
            fetch(`http://localhost:8000/api/commodity/?ticker=${ticker}&period=1d`)
          ))
        ]);

        const [fundsData, commoditiesData] = await Promise.all([
          Promise.all(fundsResponses.map(res => res.json() as Promise<ApiResponse>)),
          Promise.all(commoditiesResponses.map(res => res.json() as Promise<ApiResponse>))
        ]);

        setMarketData({
          nifty: transformIndexData(nifty),
          bankNifty: transformIndexData(bankNifty),
          topGainers: transformMoversData(movers.gainers, true),
          topLosers: transformMoversData(movers.losers, false),
          trendingStocks: transformStockData(stocks),
          mutualFunds: fundsData.map((data, index) => 
            transformFundData(data, fundsResponses[index].url)
          ),
          commodities: commoditiesData.map((data, index) => 
            transformCommodityData(data, commoditiesResponses[index].url)
          )
        });

      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/search-stocks/?query=${searchQuery}`);
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchStocks();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const analyzeStock = async () => {
      if (!selectedStock) return;

      setAnalyzing(true);
      try {
        const response = await fetch(`http://localhost:8000/api/analyze-stock/?symbol=${selectedStock}`);
        const data = await response.json();
        setStockAnalysis(data);
      } catch (error) {
        console.error('Error analyzing stock:', error);
      } finally {
        setAnalyzing(false);
      }
    };

    if (selectedStock) {
      analyzeStock();
    }
  }, [selectedStock]);

  const transformIndexData = (data: ApiResponse) => {
    // Determine which key holds the date information.
    const dateKey = data.Date ? 'Date' : data.Datetime ? 'Datetime' : 'Date';
    return data[dateKey]?.map((date, i) => ({
      time: new Date(date).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: data.Close?.[i] || 0
    })) || [];
  };
  

  const transformMoversData = (movers: [string, number, number, number][], isGainers: boolean) => {
    return movers.map(([symbol, change, price, volume]) => ({
      symbol: symbol,
      name: symbol.replace('.NS', ''),
      change: `${change?.toFixed(2)}%` || '0.00%',
      price: `₹${price?.toFixed(2) || '0.00'}`,
      volume: volume ? `${(volume/1000000).toFixed(2)}M` : '--'
    }));
  };

  const transformStockData = (stocksData: Record<string, ApiResponse>) => {
    return Object.entries(stocksData).map(([symbol, data]) => {
      const closes = data.Close || [];
      const currentPrice = closes[closes.length - 1] || 0;
      const prevPrice = closes[closes.length - 2] || currentPrice;
      const change = ((currentPrice - prevPrice) / prevPrice) * 100;
      
      return {
        symbol: symbol,
        name: symbol.replace('.NS', ''),
        price: `₹${currentPrice?.toFixed(2) || '0.00'}`,
        change: `${change?.toFixed(2)}%`,
        chart: closes.slice(-7).map((val, i) => ({ x: i, y: val }))
      };
    });
  };

  const transformFundData = (data: ApiResponse, url: string) => {
    const ticker = new URL(url).searchParams.get('ticker');
    const closes = data.Close || [];
    const currentNav = closes[closes.length - 1] || 0;
    
    return {
      name: ASSET_MAPPINGS.mutualFunds[ticker as keyof typeof ASSET_MAPPINGS.mutualFunds] || ticker,
      value: `₹${currentNav.toFixed(2)}`,
      returns1Y: calculateReturns(data, 252),
      returns3Y: calculateReturns(data, 756)
    };
  };

  const transformCommodityData = (data: ApiResponse, url: string) => {
    const ticker = new URL(url).searchParams.get('ticker');
    const closes = data.Close || [];
    const currentPrice = closes[closes.length - 1] || 0;
    const prevPrice = closes[closes.length - 2] || currentPrice;
    const change = ((currentPrice - prevPrice) / prevPrice) * 100;
    
    return {
      name: ASSET_MAPPINGS.commodities[ticker as keyof typeof ASSET_MAPPINGS.commodities] || ticker,
      price: `₹${currentPrice.toFixed(2)}`,
      change: `${change.toFixed(2)}%`
    };
  };

  const calculateReturns = (data: ApiResponse, periods: number) => {
    const closes = data.Close || [];
    if (closes.length < periods) return 'N/A';
    const start = closes[closes.length - periods];
    const end = closes[closes.length - 1];
    return `${((end - start) / start * 100).toFixed(1)}%`;
  };

  const handleSearchSelect = (symbol: string) => {
    setSelectedStock(symbol);
    setSearchQuery('');
    setShowResults(false);
    setActiveTab('stocks');
  };

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (!value) return 'N/A';
    const trillion = 1000000000000;
    const billion = 1000000000;
    const million = 1000000;
    
    if (value >= trillion) return `${(value/trillion).toFixed(2)}T`;
    if (value >= billion) return `${(value/billion).toFixed(2)}B`;
    if (value >= million) return `${(value/million).toFixed(2)}M`;
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="container max-w-7xl py-6 text-center">
        <div className="text-lg text-muted-foreground">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 space-y-8">
      <h1 className="text-3xl font-bold">Market Research</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search for stocks, mutual funds, commodities..." 
          className="pl-10 bg-card border-border/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            <ul className="py-1">
              {searchResults.map((result, index) => (
                <li 
                  key={index}
                  className="px-4 py-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleSearchSelect(result.symbol)}
                >
                  <span className="font-medium">{result.symbol.replace('.NS', '')}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{result.companyName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {selectedStock && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span>
                    {stockAnalysis?.company_name || stockAnalysis?.symbol.replace('.NS', '')}
                    {stockAnalysis?.recommendation && (
                      <Badge 
                        className={`ml-2 ${
                          stockAnalysis.recommendation === 'Strong Buy' ? 'bg-green-600' :
                          stockAnalysis.recommendation === 'Buy' ? 'bg-green-500' :
                          stockAnalysis.recommendation === 'Hold' ? 'bg-yellow-500' :
                          stockAnalysis.recommendation === 'Sell' ? 'bg-red-500' :
                          stockAnalysis.recommendation === 'Strong Sell' ? 'bg-red-600' : 'bg-gray-500'
                        }`}
                      >
                        {stockAnalysis.recommendation}
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary">
                    {stockAnalysis?.current_price ? formatCurrency(stockAnalysis.current_price) : 'N/A'}
                  </span>
                  {/* You can add price change details if available */}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedStock(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyzing ? (
              <div className="text-center py-6">
                <div className="text-lg text-muted-foreground">
                  Analyzing stock data, please wait...
                </div>
              </div>
            ) : stockAnalysis ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-muted-foreground">Overall Health</h4>
                      <span className="text-primary font-bold">
                        {stockAnalysis.health_score?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stockAnalysis.health_score} className="h-2" />
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-muted-foreground">Technical Score</h4>
                      <span className="text-primary font-bold">
                        {stockAnalysis.technical_score?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stockAnalysis.technical_score} className="h-2" />
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm text-muted-foreground">Fundamental Score</h4>
                      <span className="text-primary font-bold">
                        {stockAnalysis.fundamental_score?.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={stockAnalysis.fundamental_score} className="h-2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Entry & Exit Points</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Suggested Entry</div>
                        <div className="text-xl font-bold text-green-500">
                          {stockAnalysis.entry_point ? formatCurrency(stockAnalysis.entry_point) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Suggested Exit</div>
                        <div className="text-xl font-bold text-red-500">
                          {stockAnalysis.exit_point ? formatCurrency(stockAnalysis.exit_point) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">Key Signals</h3>
                    <ul className="space-y-2">
                      {stockAnalysis.signals.map((signal, index) => (
                        <li key={index} className="flex items-start">
                          {signal.includes('Bullish') ? (
                            <ArrowUp className="w-4 h-4 mr-2 mt-1 text-green-500" />
                          ) : signal.includes('Bearish') ? (
                            <ArrowDown className="w-4 h-4 mr-2 mt-1 text-red-500" />
                          ) : (
                            <Info className="w-4 h-4 mr-2 mt-1 text-primary" />
                          )}
                          <span>{signal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {stockAnalysis.charts && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex gap-4 mb-4 border-b border-border pb-2">
                      {['priceMA', 'rsi', 'macd', 'bollinger'].map((chart) => (
                        <Button
                          key={chart}
                          variant={activeChart === chart ? 'default' : 'ghost'}
                          onClick={() => setActiveChart(chart)}
                          className="h-8 px-3 text-sm"
                        >
                          {chart === 'priceMA' && 'Price & MA'}
                          {chart === 'rsi' && 'RSI'}
                          {chart === 'macd' && 'MACD'}
                          {chart === 'bollinger' && 'Bollinger'}
                        </Button>
                      ))}
                    </div>
                    <img
                      src={stockAnalysis.charts[activeChart as keyof typeof stockAnalysis.charts]}
                      alt={`${activeChart} chart`}
                      className="w-full h-64 object-contain"
                    />
                  </div>
                )}

                {stockAnalysis.fundamentals && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Fundamental Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Object.entries(stockAnalysis.fundamentals).map(([key, value]) => (
                        <div key={key} className="bg-background p-3 rounded-lg">
                          <div className="text-sm text-muted-foreground capitalize">{key}</div>
                          <div className="text-lg font-semibold">
                            {typeof value === 'number'
                              ? key.toLowerCase().includes('yield') || key.includes('margin')
                                ? `${value.toFixed(2)}%`
                                : key.includes('Market Cap')
                                ? formatLargeNumber(value)
                                : formatCurrency(value)
                              : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stockAnalysis.news.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Recent News</h3>
                    <div className="space-y-2">
                      {stockAnalysis.news.slice(0, 3).map((item, index) => (
                        <div key={index} className="bg-muted/30 p-3 rounded-lg">
                          <div className="text-base">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-lg text-muted-foreground">
                  Stock data is loading...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IndexChart 
          title="NIFTY 50"
          data={marketData.nifty}
          color="#9b87f5"
          currentValue={marketData.nifty.slice(-1)[0]?.value || 0}
        />
        
        <IndexChart 
          title="BANK NIFTY"
          data={marketData.bankNifty}
          color="#7E69AB"
          currentValue={marketData.bankNifty.slice(-1)[0]?.value || 0}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoversTable 
          title="Top Gainers" 
          data={marketData.topGainers} 
          positive 
          onSelect={handleStockSelect}
        />
        <MoversTable 
          title="Top Losers" 
          data={marketData.topLosers} 
          onSelect={handleStockSelect}
        />
      </div>
      
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stocks" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="mutual-funds">Mutual Funds</TabsTrigger>
              <TabsTrigger value="commodities">Commodities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stocks">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketData.trendingStocks.map((stock, index) => (
                  <StockCard 
                    key={index} 
                    stock={stock} 
                    onClick={() => handleStockSelect(stock.symbol)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="mutual-funds">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund Name</TableHead>
                      <TableHead>NAV</TableHead>
                      <TableHead>1Y Returns</TableHead>
                      <TableHead>3Y Returns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketData.mutualFunds.map((fund, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{fund.name}</TableCell>
                        <TableCell>{fund.value}</TableCell>
                        <TableCell className="text-green-500">{fund.returns1Y}</TableCell>
                        <TableCell className="text-green-500">{fund.returns3Y}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="commodities">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketData.commodities.map((commodity, index) => (
                  <CommodityCard key={index} commodity={commodity} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const IndexChart = ({ title, data, color, currentValue }: { 
  title: string;
  data: Array<{ time: string; value: number }>;
  color: string;
  currentValue: number;
}) => (
  <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex justify-between items-center">
        <span>{title}</span>
        <span className="text-primary">
          {currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" />
            <YAxis domain={['auto', 'auto']} />
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color}
              fillOpacity={1}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);

const MoversTable = ({ 
  title, 
  data, 
  positive = false, 
  onSelect 
}: { 
  title: string;
  data: Array<{ symbol: string; name: string; change: string; price: string; volume: string }>;
  positive?: boolean;
  onSelect: (symbol: string) => void;
}) => (
  <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead className="hidden md:table-cell">Volume</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow 
              key={index} 
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => onSelect(item.symbol)}
            >
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.price}</TableCell>
              <TableCell className={positive ? 'text-green-500' : 'text-red-500'}>
                {item.change}
              </TableCell>
              <TableCell className="hidden md:table-cell">{item.volume}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const StockCard = ({ 
  stock, 
  onClick 
}: { 
  stock: { symbol: string; name: string; price: string; change: string; chart: Array<{ x: number; y: number }> };
  onClick: () => void;
}) => (
  <div 
    className="cursor-pointer hover:bg-muted/50 transition-colors"
    onClick={onClick}
  >
    <Card 
      className="overflow-hidden border border-border/40 bg-muted/30" 
  >
    <CardHeader className="p-4 pb-0">
      <CardTitle className="text-base flex justify-between items-center">
        <span>{stock.name}</span>
        <span className={stock.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
          {stock.change}
        </span>
      </CardTitle>
      <div className="text-md">{stock.price}</div>
    </CardHeader>
    <CardContent className="p-3">
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stock.chart}>
            <Line
              type="monotone"
              dataKey="y"
              stroke={stock.change.startsWith('-') ? '#ef4444' : '#22c55e'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
  </div>
);

const CommodityCard = ({ commodity }: { commodity: { name: string; price: string; change: string } }) => (
  <Card className="overflow-hidden border border-border/40 bg-muted/30">
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">{commodity.name}</h3>
        <span className={commodity.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
          {commodity.change}
        </span>
      </div>
      <div className="text-2xl font-semibold">{commodity.price}</div>
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 border border-border rounded-md shadow-md">
        <p className="text-sm text-muted-foreground">{`Time: ${label}`}</p>
        <p className="text-sm font-medium">{`Value: ₹${payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</p>
      </div>
    );
  }
  return null;
};

export default Research;

