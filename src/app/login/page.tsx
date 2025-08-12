
"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    setIsLoading(false);

    if (result?.error) {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    } else if (result?.ok) {
      toast({
        title: 'Login Successful',
        description: "Welcome back!",
      });
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Welcome to BizStream</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Development Login</AlertTitle>
            <AlertDescription>
              <div className="text-xs">
                <p><span className="font-semibold">Admin:</span> admin@example.com / password</p>
                <p><span className="font-semibold">User:</span> user@example.com / password</p>
              </div>
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
