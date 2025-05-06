
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";

const formSchema = z.object({
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  function onSubmit(data: FormData) {
    setIsLoading(true);
    
    // This would be replaced with actual API call to send OTP
    setTimeout(() => {
      console.log('Forgot password initiated for:', data.phoneNumber);
      toast.success("Verification code sent to your phone!");
      setIsLoading(false);
      // Navigate to OTP verification page with the phone number
      navigate(`/verify-otp?phone=${encodeURIComponent(data.phoneNumber)}&action=reset`);
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Fin<span className="text-primary">zo</span>
          </h1>
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              Enter your phone number to receive a verification code
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
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/80" 
                  disabled={isLoading}
                >
                  {isLoading ? "Sending code..." : "Send verification code"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <Link to="/login" className="flex items-center text-sm text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
