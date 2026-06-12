import { useEffect, useMemo, useState } from 'react';
import { Loader2, CheckCircle2, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getGroupPredictions,
  saveWc2026GroupPredictions,
  type GroupMatchPrediction,
  type WcOutcome,
  type Wc2026UserPrediction,
} from '@wc/lib/api';
import { devError } from '@wc/lib/logger';

interface GroupPredictPanelProps {
  groupName: string;
  /** Subset of the user's saved predictions that belong to this group. */
  myPicksForGroup: Wc2026UserPrediction[];
  /**
   * Called after a successful save, with the user's full saved-predictions
   * list as returned by the backend. The parent uses it to refresh its
   * cache without an extra round-trip.
   */
  onSaved: (refreshed: Wc2026UserPrediction[]) => void;
}

type DraftPick = WcOutcome | null;

/**
 * Per-group fixture panel for the /wc2026 Predict tab.
 *
 * Loads the group's fixtures (with model probabilities) and lets the user
 * pick Home / Draw / Away for every match that hasn't kicked off yet. The
 * Save button bulk-uploads all picks via PUT /wc2026/predictions/group/{g}.
 */
export const GroupPredictPanel = ({
  groupName,
  myPicksForGroup,
  onSaved,
}: GroupPredictPanelProps) => {
  const { toast } = useToast();

  const [matches, setMatches] = useState<GroupMatchPrediction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // `drafts` is the in-flight edit state, keyed by fixture_id. We seed it
  // from the user's saved picks on mount so unchanged fixtures keep their
  // existing values.
  const [drafts, setDrafts] = useState<Record<number, DraftPick>>({});

  // Reload fixtures whenever the active group changes.
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const data = await getGroupPredictions(groupName);
        if (!mounted) return;
        setMatches(data?.matches ?? []);
      } catch (err) {
        devError('Failed to load group predictions', err);
        if (mounted) setMatches([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [groupName]);

  // Seed / re-seed `drafts` whenever fixtures or saved picks change. We
  // intentionally re-seed on `matches` swap so changing groups doesn't
  // leak picks from the previously selected group.
  useEffect(() => {
    if (!matches) return;
    const savedByFixture = new Map<number, WcOutcome>(
      myPicksForGroup.map((p) => [p.fixture_id, p.predicted_outcome]),
    );
    const seeded: Record<number, DraftPick> = {};
    for (const m of matches) {
      seeded[m.id] = savedByFixture.get(m.id) ?? null;
    }
    setDrafts(seeded);
  }, [matches, myPicksForGroup]);

  const savedByFixture = useMemo(
    () => new Map<number, WcOutcome>(
      myPicksForGroup.map((p) => [p.fixture_id, p.predicted_outcome]),
    ),
    [myPicksForGroup],
  );

  const dirty = useMemo(() => {
    if (!matches) return false;
    for (const m of matches) {
      // Locked fixtures are read-only; ignore them when computing dirty.
      if (m.status === 'live' || m.status === 'completed') continue;
      const current = drafts[m.id] ?? null;
      const saved = savedByFixture.get(m.id) ?? null;
      if (current !== saved) return true;
    }
    return false;
  }, [matches, drafts, savedByFixture]);

  const setPick = (fixtureId: number, outcome: WcOutcome) => {
    setDrafts((prev) => ({ ...prev, [fixtureId]: outcome }));
  };

  const handleSave = async () => {
    if (!matches) return;
    // Only submit picks that (a) have a value chosen and (b) reference a
    // still-scheduled fixture. The backend would reject locked picks
    // anyway, but filtering here keeps error toasts to user-actionable
    // problems.
    const picks = matches
      .filter((m) => m.status !== 'live' && m.status !== 'completed')
      .map((m) => ({ fixtureId: m.id, outcome: drafts[m.id] ?? null }))
      .filter((p): p is { fixtureId: number; outcome: WcOutcome } => p.outcome != null)
      .map((p) => ({ fixture_id: p.fixtureId, predicted_outcome: p.outcome }));

    if (picks.length === 0) {
      toast({
        title: 'Nothing to save',
        description: 'Pick at least one outcome before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const refreshed = await saveWc2026GroupPredictions(groupName, picks);
      onSaved(refreshed);
      toast({
        title: 'Predictions saved',
        description: `${picks.length} pick${picks.length === 1 ? '' : 's'} saved for ${groupName}.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed.';
      toast({
        title: 'Could not save predictions',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No fixtures scheduled for {groupName} yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((m) => {
        const isLocked = m.status === 'live' || m.status === 'completed';
        const draft = drafts[m.id] ?? null;
        const saved = savedByFixture.get(m.id) ?? null;
        const hasUnsavedChange = !isLocked && draft !== saved;

        return (
          <Card
            key={m.id}
            className="p-4 border-2 border-border bg-card/60 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="font-display text-base">
                {m.home_team} <span className="text-secondary">vs</span> {m.away_team}
              </div>
              <div className="text-xs text-muted-foreground">
                {m.date}{m.time ? ` · ${m.time}` : ''}
              </div>
            </div>

            {/* Model probability strip — purely informational, helps the
                user choose without dictating the answer. */}
            {m.prediction && (
              <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                <span>Model: H {(m.prediction.home_win * 100).toFixed(0)}%</span>
                <span>D {(m.prediction.draw * 100).toFixed(0)}%</span>
                <span>A {(m.prediction.away_win * 100).toFixed(0)}%</span>
                <span className="ml-auto text-secondary">
                  picks {m.prediction.predicted}
                </span>
              </div>
            )}

            {isLocked ? (
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Predictions locked — match has kicked off.</span>
                {saved && (
                  <Badge variant="outline" className="ml-auto">
                    You picked: {saved}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {(['Home', 'Draw', 'Away'] as const).map((outcome) => {
                  const isActive = draft === outcome;
                  const label =
                    outcome === 'Home' ? `Home (${m.home_team})`
                    : outcome === 'Away' ? `Away (${m.away_team})`
                    : 'Draw';
                  return (
                    <Button
                      key={outcome}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      className={isActive ? 'bg-secondary text-secondary-foreground' : ''}
                      onClick={() => setPick(m.id, outcome)}
                    >
                      {isActive && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {label}
                    </Button>
                  );
                })}
                {hasUnsavedChange && (
                  <span className="ml-auto text-xs text-accent self-center">
                    unsaved change
                  </span>
                )}
                {!hasUnsavedChange && saved && (
                  <span className="ml-auto text-xs text-muted-foreground self-center inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-400" /> saved
                  </span>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-display"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <>💾 Save {groupName} picks</>
          )}
        </Button>
      </div>
    </div>
  );
};
