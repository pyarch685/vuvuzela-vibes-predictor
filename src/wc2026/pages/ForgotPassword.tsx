import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { NavHeader } from '@wc/components/NavHeader';
import { StadiumCard } from '@wc/components/StadiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { requestPasswordReset } from '@wc/lib/api';

const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Please enter a valid email address.' })
  .max(255);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordReset(parsed.data);
      setSubmitted(true);
      toast({
        title: 'Check your inbox',
        description: 'If an account exists for that email, a reset link is on its way.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      toast({ title: 'Request failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto max-w-md px-4 py-12">
        <StadiumCard title="Forgot Password">
          {submitted ? (
            <div className="space-y-4 py-4 text-center">
              <Mail className="mx-auto h-10 w-10 text-secondary" />
              <p className="text-foreground">
                If an account exists for <strong>{email}</strong>, we've sent a password
                reset link. The link expires shortly — check your inbox (and spam folder).
              </p>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the email associated with your account and we'll send you a link to
                reset your password.
              </p>
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link to="/" className="text-primary hover:underline">
                  Back to home
                </Link>
              </p>
            </form>
          )}
        </StadiumCard>
      </main>
    </div>
  );
};

export default ForgotPassword;
