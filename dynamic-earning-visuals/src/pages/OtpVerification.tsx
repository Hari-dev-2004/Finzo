// src/pages/OtpVerification.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import api from '../api/axios';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const formSchema = z.object({
  otp: z.string().min(6, 'Please enter the complete verification code'),
});

type FormData = z.infer<typeof formSchema>;

const OtpVerification = () => {
  const [searchParams] = useSearchParams();
  const userEmail = decodeURIComponent(searchParams.get('email') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
    },
  });

  useEffect(() => {
    if (resendDisabled && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(30);
    }
  }, [resendDisabled, countdown]);

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const response = await api.post('verify-email-otp/', {
        email: userEmail,
        otp: data.otp,
      });
      
      if (response.status === 200) {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        login(response.data.access, response.data.user);
        toast.success('Verification successful!');
        navigate('/personal-data');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('OTP verification failed. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    toast.info('Sending a new verification code...');
    setResendDisabled(true);
    setCountdown(30);
    
    try {
      const response = await api.post('send-email-otp/', {
        email: userEmail,
      });
      if (response.status === 200) {
        toast.success('New verification code sent!');
      }
    } catch (error) {
      setResendDisabled(false);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error('Invalid email address. Please try again.');
        } else {
          toast.error('Failed to resend OTP. Please try again later.');
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Fin<span className="text-primary">zo</span>
          </h1>
          <p className="text-muted-foreground">Verify your email</p>
        </div>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Enter Verification Code</CardTitle>
            <CardDescription className="text-center">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium text-primary">{userEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <div className="flex flex-col items-center space-y-2">
                        <FormControl>
                          <InputOTP 
                            maxLength={6} 
                            {...field}
                            className="flex justify-center"
                            containerClassName="gap-2"
                          >
                            <InputOTPGroup>
                              {[...Array(6)].map((_, index) => (
                                <InputOTPSlot 
                                  key={index} 
                                  index={index} 
                                  className="border-border/60 bg-card/60"
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="text-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={resendDisabled}
                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {resendDisabled 
                      ? `Resend code in ${countdown}s` 
                      : "Resend verification code"}
                  </Button>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/80" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Verifying..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Verify
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <Link 
              to="/login" 
              className="flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default OtpVerification;