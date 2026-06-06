import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { initPaystackPayment } from '@wc/lib/api';
import { UNLOCK_LABELS, UNLOCK_PRICES_USD, type UnlockKind } from '@wc/lib/pricing';

interface PaywallLockProps {
  kind: UnlockKind;
  itemKey: string;
  title?: string;
  subtitle?: string;
}

export const PaywallLock = ({ kind, itemKey, title, subtitle }: PaywallLockProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const price = UNLOCK_PRICES_USD[kind];

  const handleUnlock = async () => {
    setLoading(true);
    try {
      // Remember which item triggered checkout, so we can refresh unlocks on return.
      sessionStorage.setItem('pending_unlock', itemKey);
      const res = await initPaystackPayment(kind, itemKey, price);
      window.location.href = res.authorization_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      toast({ title: 'Payment error', description: msg, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-lg border-2 border-dashed border-secondary/40 bg-card/40 backdrop-blur-sm p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-full bg-secondary/20 p-2 shrink-0">
          <Lock className="h-4 w-4 text-secondary" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-base truncate">{title ?? UNLOCK_LABELS[kind]}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleUnlock}
        disabled={loading}
        className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shrink-0"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Unlock $${price}`}
      </Button>
    </div>
  );
};
