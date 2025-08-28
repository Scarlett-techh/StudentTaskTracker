import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  // Request password reset mutation
  const requestResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('POST', '/api/password-reset/request', { email });
    },
    onSuccess: () => {
      toast({
        title: 'Recovery email sent',
        description: 'If an account with that email exists, you will receive instructions to reset your password.',
      });
      setEmail('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    requestResetMutation.mutate(email);
  };

  return (
    <>

      <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-between items-center">
              <Link href="/login" className="flex items-center text-sm text-gray-500 hover:text-primary">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </div>
            <CardTitle className="text-xl font-bold text-center mt-4">Forgot your password?</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-500">
              Remember your password? <Link href="/login" className="text-primary font-semibold hover:underline">Log in</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}