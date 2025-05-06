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
import { Mail, Phone, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc'; // Google icon
import { FaFacebook } from 'react-icons/fa'; // Facebook icon
import { FaXTwitter } from 'react-icons/fa6'; // X (Twitter) icon
import { toast } from 'sonner';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      const apiData = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        email: data.email,
        password: data.password,
      };

      const response = await axios.post('http://127.0.0.1:8000/api/register/', apiData);

      if (response.status === 201) {
        toast.success('Registration successful! An OTP has been sent to your email.');
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverError = error.response?.data;
        if (serverError) {
          if (typeof serverError === 'object' && !Array.isArray(serverError)) {
            Object.entries(serverError).forEach(([field, messages]) => {
              let key = field;
              if (field === 'phone_number') {
                key = 'phoneNumber';
              }
              const errorMessage = Array.isArray(messages)
                ? messages.join(', ')
                : String(messages);
              form.setError(key as keyof FormData, {
                type: 'server',
                message: errorMessage,
              });
            });
          } else {
            toast.error(serverError || 'Registration failed');
          }
        } else {
          toast.error('Network error - please try again');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSocialRegister(provider: string) {
    toast.info(`Registering with ${provider}...`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Fin<span className="text-primary">zo</span>
          </h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input className="pl-10" placeholder="First name" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Phone number" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input className="pl-10" placeholder="Email address" {...field} />
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
                          placeholder="Create a password"
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
                  {isLoading ? 'Creating Account...' : 'Register'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/60 px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full hover:bg-accent/60 transition-colors"
                    onClick={() => handleSocialRegister('google')}
                  >
                    <FcGoogle className="h-4 w-4" /> {/* Google icon */}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full hover:bg-accent/60 transition-colors"
                    onClick={() => handleSocialRegister('facebook')}
                  >
                    <FaFacebook className="h-4 w-4 text-[#1877F2]" /> {/* Facebook icon */}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full hover:bg-accent/60 transition-colors"
                    onClick={() => handleSocialRegister('x')}
                  >
                    <FaXTwitter className="h-4 w-4" /> {/* X (Twitter) icon */}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;