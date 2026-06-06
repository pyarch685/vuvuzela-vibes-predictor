import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Trophy } from 'lucide-react';
import { PaywallLock } from './PaywallLock';
import {
  getGroupPredictions,
  getUserUnlocks,
  isAuthenticated,
  type GroupMatchPrediction,
} from '@wc/lib/api';
import { buildItemKey } from '@wc/lib/pricing';
import { devLog } from '@wc/lib/logger';

interface GroupPredictionsProps {
  groupName: string;
}

const FREE_LIMIT = 2;

export const GroupPredictions = ({ groupName }: GroupPredictionsProps) => {
  const [matches, setMatches] = useState<GroupMatchPrediction[] | null>(null);
  const [winner, setWinner] = useState<{ team: string; probability: number } | null>(null);
  const [unlocks, setUnlocks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [data, unlockList] = await Promise.all([
          getGroupPredictions(groupName),
          getUserUnlocks(),
        ]);
        if (!mounted) return;
        setMatches(data?.matches ?? []);
        setWinner(data?.winner ?? null);
        setUnlocks(new Set(unlockList));
      } catch (e) {
        devLog('Group predictions load failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupName]);

  if (!isAuthenticated()) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-secondary" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <p className="text-xs text-center text-muted-foreground py-3">
        Predictions will appear once fixtures are scheduled.
      </p>
    );
  }

  const winnerKey = buildItemKey('group_winner', groupName);
  const winnerUnlocked = unlocks.has(winnerKey);

  return (
    <div className="p-4 space-y-3 border-t border-border bg-background/40">
      {matches.map((m, idx) => {
        const itemKey = buildItemKey('group_match', String(m.id));
        const isFree = idx < FREE_LIMIT;
        const unlocked = isFree || unlocks.has(itemKey);
        const label = `${m.home_team} vs ${m.away_team}`;

        if (!unlocked) {
          return (
            <PaywallLock
              key={m.id}
              kind="group_match"
              itemKey={itemKey}
              title={label}
              subtitle={m.date}
            />
          );
        }

        return (
          <div
            key={m.id}
            className="rounded-lg border border-border bg-card/60 p-3 text-sm"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">{label}</span>
              {isFree && (
                <span className="text-[10px] uppercase tracking-wide text-accent">
                  Free
                </span>
              )}
            </div>
            {m.prediction ? (
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>1: {(m.prediction.home_win * 100).toFixed(0)}%</span>
                <span>X: {(m.prediction.draw * 100).toFixed(0)}%</span>
                <span>2: {(m.prediction.away_win * 100).toFixed(0)}%</span>
                <span className="ml-auto text-secondary font-semibold">
                  {m.prediction.predicted}
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Prediction pending</p>
            )}
          </div>
        );
      })}

      {winnerUnlocked && winner ? (
        <Card className="p-3 border-accent/40 bg-accent/10 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="text-sm font-display">Predicted winner:</span>
          <span className="text-sm font-bold text-accent">
            {winner.team} ({(winner.probability * 100).toFixed(0)}%)
          </span>
        </Card>
      ) : (
        <PaywallLock
          kind="group_winner"
          itemKey={winnerKey}
          title={`${groupName} winner`}
          subtitle="Unlock the AI's group winner pick"
        />
      )}
    </div>
  );
};
