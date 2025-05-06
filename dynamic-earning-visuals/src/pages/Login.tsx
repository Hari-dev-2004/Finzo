import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Github, Mail, Phone, X } from 'lucide-react';
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      password: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const apiData = {
        phone_number: data.phoneNumber,
        password: data.password,
      };
      const response = await axios.post("http://127.0.0.1:8000/api/login/", apiData);
      
      if (response.status === 200) {
        toast.success("Login successful!");
        
        // Store tokens and user data
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        login(response.data.access, response.data.user);

        if (response.data.user.has_completed_financial_info) {
          navigate('/dashboard');
        } else {
          navigate('/personal-data');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          const status = error.response.status;
          const errorMessage = error.response.data?.detail || "An unknown error occurred";
          
          if (status === 403) {
            toast.error("Account not verified. Please check your email for verification instructions.");
          } else if (status === 400) {
            toast.error("Invalid credentials. Please check your phone number and password.");
          } else if (status === 401) {
            toast.error("Authentication failed. Please check your credentials and try again.");
          } else if (status >= 500) {
            toast.error("Server error. Please try again later.");
          } else {
            toast.error(errorMessage);
          }
        } else if (error.request) {
          // The request was made but no response was received
          toast.error("No response from server. Please check your internet connection.");
        } else {
          // Something happened in setting up the request
          toast.error("Error preparing request. Please try again.");
        }
      } else {
        toast.error("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSocialLogin(provider: string) {
    toast.info(`Logging in with ${provider}...`);
    // Implement actual social login if needed
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Fin<span className="text-primary">zo</span>
          </h1>
          <p className="text-muted-foreground">Log in to your account</p>
        </div>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Enter your phone number" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/80" 
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleSocialLogin('Google')}
                  className="bg-muted/50 hover:bg-muted"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleSocialLogin('Facebook')}
                  className="bg-muted/50 hover:bg-muted"
                >
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleSocialLogin('X')}
                  className="bg-muted/50 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Register now
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
