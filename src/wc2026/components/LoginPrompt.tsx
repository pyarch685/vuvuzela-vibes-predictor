import { Lock, LogIn, UserPlus } from 'lucide-react';
import { StadiumCard } from '@wc/components/StadiumCard';
import { Button } from '@/components/ui/button';

interface LoginPromptProps {
  title?: string;
  description?: string;
}

export const LoginPrompt = ({
  title = 'Login Required',
  description = 'Sign in to view fixtures, model status, and benchmark results.',
}: LoginPromptProps) => {
  return (
    <StadiumCard title={title}>
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <Lock className="h-10 w-10 text-secondary" />
        </div>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => window.dispatchEvent(new Event('open-login'))}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <Button
            variant="outline"
            onClick={() => window.dispatchEvent(new Event('open-register'))}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Register
          </Button>
        </div>
      </div>
    </StadiumCard>
  );
};
