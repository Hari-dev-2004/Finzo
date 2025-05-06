import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/ui/motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/toast-wrapper";
import { DollarSign, CalendarClock, Target, TrendingUp, CreditCard, PiggyBank, BarChart, ShoppingCart, AlertCircle, Loader2 } from "lucide-react";
import axios from 'axios'; // Import axios for API requests
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

// API endpoint
const API_URL = 'http://127.0.0.1:8000/api';

const formSchema = z.object({
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  monthlyExpenses: z.string().min(1, "Monthly expenses is required"),
  currentSavings: z.string().min(1, "Current savings is required"),
  existingInvestments: z.string().default("0"),
  currentDebt: z.string().default("0"),
  financialGoals: z.string().min(5, "Please describe your financial goals"),
  riskTolerance: z.string().min(1, "Please select a risk tolerance level"),
  investmentTimeHorizon: z.string().min(1, "Please select an investment time horizon"),
  investmentPreferences: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const timeHorizons = [
  { value: "short", label: "Short-term (0-2 years)" },
  { value: "medium", label: "Medium-term (3-7 years)" },
  { value: "long", label: "Long-term (8+ years)" },
];

const investmentTypes = [
  { id: "stocks", label: "Stocks" },
  { id: "bonds", label: "Bonds" },
  { id: "real_estate", label: "Real Estate" },
  { id: "crypto", label: "Cryptocurrency" },
  { id: "etfs", label: "ETFs & Index Funds" },
];

const PersonalData = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyIncome: "",
      monthlyExpenses: "",
      currentSavings: "",
      existingInvestments: "0",
      currentDebt: "0",
      financialGoals: "",
      riskTolerance: "moderate",
      investmentTimeHorizon: "medium",
      investmentPreferences: [],
    },
  });

  // Fetch financial profile on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      toast({ 
        title: "Authentication Required", 
        description: "Please log in to access financial profile", 
        variant: "destructive" 
      });
      navigate('/login');
      return;
    }
    
    const fetchFinancialProfile = async () => {
      try {
        setFetchingProfile(true);
        setError(null);
        
        const response = await axios.get(
          `${API_URL}/financial-profile/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const profileData = response.data;
        
        if (profileData) {
          setHasExistingProfile(true);
          
          // Format currency values with commas
          const formatNumber = (num: number) => num.toLocaleString('en-US');
          
          // Set form values with existing data
          form.reset({
            monthlyIncome: formatNumber(profileData.monthly_income),
            monthlyExpenses: formatNumber(profileData.monthly_expenses),
            currentSavings: formatNumber(profileData.current_savings),
            existingInvestments: formatNumber(profileData.existing_investments),
            currentDebt: formatNumber(profileData.current_debt),
            financialGoals: profileData.financial_goals,
            riskTolerance: profileData.risk_tolerance,
            investmentTimeHorizon: profileData.investment_time_horizon,
            investmentPreferences: profileData.investment_preferences || [],
          });
        }
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          // No profile exists yet, which is fine
          setHasExistingProfile(false);
        } else {
          console.error("Error fetching financial profile:", err);
          setError("Failed to load your financial profile. Please try again.");
        }
      } finally {
        setFetchingProfile(false);
      }
    };
    
    fetchFinancialProfile();
  }, [isAuthenticated, token, navigate, form]);

  const formatCurrency = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    // Format with commas for thousands
    if (value) {
      value = Number(value).toLocaleString('en-US');
    }
    
    return value;
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
  
    try {
      const payload = {
        monthly_income: Number(data.monthlyIncome.replace(/,/g, '')),
        monthly_expenses: Number(data.monthlyExpenses.replace(/,/g, '')),
        current_savings: Number(data.currentSavings.replace(/,/g, '')),
        existing_investments: Number(data.existingInvestments.replace(/,/g, '')),
        current_debt: Number(data.currentDebt.replace(/,/g, '')),
        financial_goals: data.financialGoals,
        risk_tolerance: data.riskTolerance,
        investment_time_horizon: data.investmentTimeHorizon,
        investment_preferences: data.investmentPreferences,
      };
  
      const endpoint = `${API_URL}/financial-profile/`;
      const method = hasExistingProfile ? 'put' : 'post';
      
      const response = await axios({
        method,
        url: endpoint,
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      toast({ 
        title: hasExistingProfile ? "Profile updated" : "Profile created", 
        description: "Your financial profile has been saved successfully" 
      });
      
      // Set has existing profile to true after successful creation
      if (!hasExistingProfile) {
        setHasExistingProfile(true);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <Motion animation="fade-in" duration={0.6}>
          <h1 className="text-4xl font-bold mb-4 text-gradient">Financial Profile</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {hasExistingProfile 
              ? "Update your financial profile to refine your personalized recommendations." 
              : "Complete your financial profile to get personalized recommendations and insights."}
          </p>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        
          <Card className="border border-muted/20 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>
                {hasExistingProfile ? "Update Financial Information" : "Personal Financial Information"}
              </CardTitle>
              <CardDescription>
                This information helps us provide you with tailored financial advice and insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fetchingProfile ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-finzo-purple" />
                  <span className="ml-2">Loading your financial profile...</span>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Monthly Income */}
                      <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-finzo-purple" />
                              Monthly Income
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input 
                                  placeholder="5,000" 
                                  className="pl-8" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(formatCurrency(e));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Monthly Expenses */}
                      <FormField
                        control={form.control}
                        name="monthlyExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-finzo-purple" />
                              Monthly Expenses
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input 
                                  placeholder="3,500" 
                                  className="pl-8" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(formatCurrency(e));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Current Savings */}
                      <FormField
                        control={form.control}
                        name="currentSavings"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <PiggyBank className="h-4 w-4 text-finzo-purple" />
                              Current Savings
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input 
                                  placeholder="15,000" 
                                  className="pl-8" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(formatCurrency(e));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Existing Investments */}
                      <FormField
                        control={form.control}
                        name="existingInvestments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <BarChart className="h-4 w-4 text-finzo-purple" />
                              Existing Investments
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input 
                                  placeholder="25,000" 
                                  className="pl-8" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(formatCurrency(e));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Current Debt */}
                      <FormField
                        control={form.control}
                        name="currentDebt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-finzo-purple" />
                              Current Debt
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input 
                                  placeholder="5,000" 
                                  className="pl-8" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(formatCurrency(e));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Financial Goals */}
                    <FormField
                      control={form.control}
                      name="financialGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-finzo-purple" />
                            Financial Goals
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your financial goals, e.g., buying a house, retirement planning, education fund..." 
                              className="min-h-[100px] resize-none" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Your financial goals help us provide relevant recommendations.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Risk Tolerance */}
                      <FormField
                        control={form.control}
                        name="riskTolerance"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-finzo-purple" />
                              Risk Tolerance
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="conservative" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Conservative (Prefer safety and stability)
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="moderate" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Moderate (Balance between growth and safety)
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="aggressive" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Aggressive (Prioritize high growth potential)
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Investment Time Horizon */}
                      <FormField
                        control={form.control}
                        name="investmentTimeHorizon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <CalendarClock className="h-4 w-4 text-finzo-purple" />
                              Investment Time Horizon
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your investment time frame" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeHorizons.map((horizon) => (
                                  <SelectItem key={horizon.value} value={horizon.value}>
                                    {horizon.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This helps us determine appropriate investment strategies.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Investment Preferences */}
                    <FormField
                      control={form.control}
                      name="investmentPreferences"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-finzo-purple" />
                              Investment Preferences
                            </FormLabel>
                            <FormDescription>
                              Select all investment types you're interested in.
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {investmentTypes.map((type) => (
                              <FormField
                                key={type.id}
                                control={form.control}
                                name="investmentPreferences"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={type.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(type.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value || [], type.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== type.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {type.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isLoading} 
                        className="bg-finzo-purple hover:bg-finzo-purple/80"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {hasExistingProfile ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          hasExistingProfile ? "Update Profile" : "Save Profile"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </Motion>
      </div>
      
      <Footer />
    </div>
  );
};

export default PersonalData;