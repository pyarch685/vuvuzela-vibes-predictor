import { Lock, LogIn, UserPlus, Info } from 'lucide-react';
import { StadiumCard } from '@wc/components/StadiumCard';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center cursor-help">
              <Lock className="h-10 w-10 text-secondary" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Authentication required</p>
              <p className="text-xs text-muted-foreground">
                Log in to access predictions, fixtures, group standings, model benchmarks, and unlock paid content.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
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
