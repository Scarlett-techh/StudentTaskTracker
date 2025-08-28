import { useState } from 'react';
import { useLocation, Link, useRoute } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Lock, Check } from 'lucide-react';

export default function ResetPassword() {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessful, setResetSuccessful] = useState(false);
  
  // Get token from URL
  const [, params] = useRoute('/reset-password/:token');
  const token = params?.token;
  
  const [, navigate] = useLocation();

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string, newPassword: string }) => {
      return apiRequest('POST', '/api/password-reset/reset', { token, newPassword });
    },
    onSuccess: () => {
      setResetSuccessful(true);
      toast({
        title: 'Password reset successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Invalid or expired reset token. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'The password reset link appears to be invalid.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Your password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }
    
    resetPasswordMutation.mutate({ token, newPassword: password });
  };

  return (
    <>

      <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
        <Card className="w-full max-w-md shadow-lg">
          {resetSuccessful ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-center">Password Reset Successful!</CardTitle>
                <CardDescription className="text-center">
                  Your password has been reset successfully. You can now log in with your new password.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pt-4">
                <Button onClick={() => navigate('/login')}>Go to Login</Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-center">
                  <Link href="/login" className="flex items-center text-sm text-gray-500 hover:text-primary">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
                <CardTitle className="text-xl font-bold text-center mt-4">Reset Your Password</CardTitle>
                <CardDescription className="text-center">
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Must be at least 6 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </>
  );
}