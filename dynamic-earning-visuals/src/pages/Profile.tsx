import React, { useState, useEffect } from 'react';
import { Motion } from '@/components/ui/motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, User, DollarSign, PiggyBank, Scale, BarChart, Clock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import axios from 'axios';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  monthly_income: number;
  monthly_expenses: number;
  current_savings: number;
  current_debt: number;
  risk_tolerance: string;
  investment_time_horizon: string;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    monthly_income: 0,
    monthly_expenses: 0,
    current_savings: 0,
    current_debt: 0,
    risk_tolerance: '',
    investment_time_horizon: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [userRes, financialRes] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/user-profile/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }),
          axios.get('http://127.0.0.1:8000/api/financial-profile/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          })
        ]);
        
        setProfileData({
          ...userRes.data,
          ...financialRes.data
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    fetchProfileData();
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.patch('http://127.0.0.1:8000/api/user-profile/', 
        {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone_number: profileData.phone_number
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      await axios.post('http://127.0.0.1:8000/api/financial-profile/', 
        {
          monthly_income: profileData.monthly_income,
          monthly_expenses: profileData.monthly_expenses,
          current_savings: profileData.current_savings,
          current_debt: profileData.current_debt,
          risk_tolerance: profileData.risk_tolerance,
          investment_time_horizon: profileData.investment_time_horizon
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-finzo-black min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <Motion animation="fade-in" duration={0.6}>
          <h1 className="text-4xl font-bold mb-8 text-gradient">Profile Management</h1>
        </Motion>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Profile Card */}
          <Motion animation="fade-in" delay={0.2}>
            <Card className="glass-card lg:col-span-1">
              <CardHeader className="text-center">
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="h-24 w-24 mb-4 border-2 border-finzo-purple">
                    <AvatarFallback className="bg-finzo-dark-purple text-white text-xl">
                      {profileData.first_name.charAt(0)}{profileData.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-2xl">
                    {profileData.first_name} {profileData.last_name}
                  </CardTitle>
                  <CardDescription className="mt-1">{profileData.email}</CardDescription>
                  <Button 
                    variant="ghost" 
                    className="mt-3 text-finzo-purple hover:text-finzo-light-purple"
                    onClick={handleEditToggle}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">2025</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Risk Tolerance</span>
                    <span className="font-medium">{profileData.risk_tolerance}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Investment Horizon</span>
                    <span className="font-medium">{profileData.investment_time_horizon}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Motion>

          {/* Main Content */}
          <Motion animation="fade-in" delay={0.3}>
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-finzo-purple" />
                  {isEditing ? 'Edit Profile' : 'Profile Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-finzo-purple flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Personal Information
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input
                              name="first_name"
                              value={profileData.first_name}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input
                              name="last_name"
                              value={profileData.last_name}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                              name="email"
                              type="email"
                              value={profileData.email}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              name="phone_number"
                              value={profileData.phone_number}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-finzo-purple flex items-center">
                          <DollarSign className="w-5 h-5 mr-2" />
                          Financial Information
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label>Monthly Income</Label>
                            <Input
                              name="monthly_income"
                              type="number"
                              value={profileData.monthly_income}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Monthly Expenses</Label>
                            <Input
                              name="monthly_expenses"
                              type="number"
                              value={profileData.monthly_expenses}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Current Savings</Label>
                            <Input
                              name="current_savings"
                              type="number"
                              value={profileData.current_savings}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Current Debt</Label>
                            <Input
                              name="current_debt"
                              type="number"
                              value={profileData.current_debt}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-finzo-purple hover:bg-finzo-dark-purple"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-finzo-purple flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Full Name</span>
                          <span className="font-medium">
                            {profileData.first_name} {profileData.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium">{profileData.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium">{profileData.phone_number}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-finzo-purple flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Financial Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Monthly Income</span>
                          <span className="font-medium">
                            {formatCurrency(profileData.monthly_income)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Monthly Expenses</span>
                          <span className="font-medium">
                            {formatCurrency(profileData.monthly_expenses)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Current Savings</span>
                          <span className="font-medium">
                            {formatCurrency(profileData.current_savings)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Current Debt</span>
                          <span className="font-medium">
                            {formatCurrency(profileData.current_debt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Motion>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
