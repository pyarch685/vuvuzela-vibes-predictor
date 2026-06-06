import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { NavHeader } from '@wc/components/NavHeader';
import { StadiumCard } from '@wc/components/StadiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@wc/lib/api';

// Matches the password rule shown on the register form.
const passwordSchema = z
  .string()
  .min(8, { message: 'Must be at least 8 characters.' })
  .max(128)
  .regex(/[A-Z]/, { message: 'Must include an uppercase letter.' })
  .regex(/[a-z]/, { message: 'Must include a lowercase letter.' })
  .regex(/\d/, { message: 'Must include a digit.' })
  .regex(/[^A-Za-z0-9]/, { message: 'Must include a special character.' });

// Decode JWT payload without verifying signature — safe for extracting prefills.
function getEmailFromResetToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    const candidate = payload.email || payload.sub || null;
    return candidate && String(candidate).includes('@') ? String(candidate) : null;
  } catch {
    return null;
  }
}

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = useMemo(() => params.get('token')?.trim() ?? '', [params]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid password');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Missing reset token.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, parsed.data);
      setSuccess(true);
      toast({
        title: 'Password updated',
        description: 'You can now log in with your new password.',
      });

      // Pre-fill email in login dialog if we can extract it from the token.
      const resetEmail = getEmailFromResetToken(token);
      if (resetEmail) {
        sessionStorage.setItem('wc2026_prefill_email', resetEmail);
      }
      sessionStorage.setItem('wc2026_open_login', 'true');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container mx-auto max-w-md px-4 py-12">
        <StadiumCard title="Reset Password">
          {success ? (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-secondary" />
              <p className="text-foreground">
                Your password has been updated. Redirecting you home…
              </p>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Go now
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters and include uppercase, lowercase, digit, and special character.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Need a new link?{' '}
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Request reset
                </Link>
              </p>
            </form>
          )}
        </StadiumCard>
      </main>
    </div>
  );
};

export default ResetPassword;
