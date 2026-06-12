import { useState, useEffect, useRef } from 'react';
import { devLog, devError } from '@wc/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Confetti } from '@wc/components/Confetti';
import { FloatingElements } from '@wc/components/FloatingElements';
import { HeroSection } from '@wc/components/HeroSection';
import { StadiumCard } from '@wc/components/StadiumCard';
import { FixtureCard } from '@wc/components/FixtureCard';
import { Footer } from '@wc/components/Footer';
import { NavHeader } from '@wc/components/NavHeader';
import { TwitterSidebar } from '@wc/components/TwitterSidebar';
import { SponsorPlaceholder } from '@wc/components/SponsorPlaceholder';
import { SponsorBanner } from '@wc/components/SponsorBanner';
import { LoginPrompt } from '@wc/components/LoginPrompt';
import { GroupPredictPanel } from '@wc/components/GroupPredictPanel';
import {
  getWc2026Fixtures,
  getModelStatus,
  getMyWc2026Predictions,
  Wc2026Fixture,
  ModelStatus,
  Wc2026UserPrediction,
  isAuthenticated,
  API_HOST_LABEL,
} from '@wc/lib/api';
import { Loader2 } from 'lucide-react';

const WC2026_GROUP_NAMES = [
  'Group A', 'Group B', 'Group C', 'Group D',
  'Group E', 'Group F', 'Group G', 'Group H',
  'Group I', 'Group J', 'Group K', 'Group L',
] as const;

/** Group an already-chronologically-sorted fixture list by ISO match_date. */
const groupFixturesByDate = (
  fixtures: Wc2026Fixture[],
): Array<[string, Wc2026Fixture[]]> => {
  const buckets = new Map<string, Wc2026Fixture[]>();
  for (const fx of fixtures) {
    const key = fx.match_date;
    const existing = buckets.get(key);
    if (existing) existing.push(fx);
    else buckets.set(key, [fx]);
  }
  return Array.from(buckets.entries());
};

/**
 * Render an ISO YYYY-MM-DD as e.g. "Today · Friday, Jun 12" / "Tomorrow ..."
 * / "Friday, Jun 12". Compared at the calendar-date level in local time so
 * a stadium kickoff at 02:00 UTC the next day still rolls correctly.
 */
const formatDateHeading = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const pretty = target.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  if (diffDays === 0) return `Today · ${pretty}`;
  if (diffDays === 1) return `Tomorrow · ${pretty}`;
  if (diffDays === -1) return `Yesterday · ${pretty}`;
  return pretty;
};

const Index = () => {
  const [fixtures, setFixtures] = useState<Wc2026Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  // Predict-tab state — selected group + the user's saved picks across
  // all groups. We load saved picks once per auth session and let the
  // GroupPredictPanel filter to the active group locally.
  const [selectedGroup, setSelectedGroup] = useState<string>('Group A');
  const [myPredictions, setMyPredictions] = useState<Wc2026UserPrediction[]>([]);
  const [myPredictionsLoaded, setMyPredictionsLoaded] = useState(false);

  // Track if we've attempted to fetch fixtures
  const hasFetchedRef = useRef(false);
  
  // Fetch fixtures on mount and when authentication changes
  useEffect(() => {
    const syncAuthState = () => {
      setAuthenticated(isAuthenticated());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        syncAuthState();
      }
    };

    window.addEventListener('auth-changed', syncAuthState);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth-changed', syncAuthState);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const fetchFixtures = async () => {
      // Only fetch fixtures if user is authenticated
      if (!authenticated) {
        if (mounted) {
          setFixtures([]);
          setFixturesLoading(false);
          hasFetchedRef.current = false;
        }
        return;
      }

      // Don't fetch if we already fetched successfully in this auth session
      if (hasFetchedRef.current) {
        return;
      }

      if (mounted) {
        setFixturesLoading(true);
        hasFetchedRef.current = true;
      }
      
      try {
        // Rolling 7-day window of WC2026 matches starting from today.
        // The /wc2026/fixtures endpoint is public, but we still gate the
        // tab behind authentication for now to preserve the existing UX
        // and unify with the other tabs' permission model.
        const data = await getWc2026Fixtures({ days: 7 });
        if (mounted) {
          setFixtures(data?.fixtures ?? []);
          devLog('WC2026 fixtures loaded:', data?.fixtures?.length ?? 0);
        }
      } catch (error) {
        devError('Failed to fetch WC2026 fixtures:', error);
        if (mounted) {
          hasFetchedRef.current = false; // allow retry on error
          setFixtures([]);
        }
      } finally {
        if (mounted) {
          setFixturesLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchFixtures();
    
    const handleAuthChanged = () => {
      if (mounted) {
        hasFetchedRef.current = false;
        fetchFixtures();
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    
    return () => {
      mounted = false;
      window.removeEventListener('auth-changed', handleAuthChanged);
    };
  }, [authenticated]);

  // Fetch model status
  const fetchModelStatus = async () => {
    if (!authenticated) {
      setModelStatus(null);
      return;
    }

    setStatusLoading(true);
    try {
      const data = await getModelStatus();
      setModelStatus(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('Session expired') || errorMessage.includes('Authentication required')) {
        setAuthenticated(false);
        setModelStatus(null);
      } else {
        setModelStatus({ status: 'offline', accuracy: undefined, last_trained: undefined });
      }
    } finally {
      setStatusLoading(false);
    }
  };

  // Load the user's saved WC2026 picks once per auth session so the
  // Predict tab can pre-fill the H/D/A pickers without a per-group
  // round-trip.
  useEffect(() => {
    if (!authenticated) {
      setMyPredictions([]);
      setMyPredictionsLoaded(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await getMyWc2026Predictions();
        if (mounted) {
          setMyPredictions(data);
          setMyPredictionsLoaded(true);
        }
      } catch (err) {
        devError('Failed to load saved predictions', err);
        if (mounted) {
          setMyPredictions([]);
          setMyPredictionsLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, [authenticated]);

  return (
      <div className="min-h-screen stadium-gradient relative overflow-hidden">
        <NavHeader />
        <Confetti />
        <FloatingElements />
        
        
        <HeroSection />

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex justify-center gap-6 items-stretch">
            <SponsorPlaceholder side="left" />
            
            <main className="w-full max-w-4xl flex flex-col">
              <Tabs defaultValue="predict" className="w-full">
                <TabsList className="w-full grid grid-cols-3 bg-card/50 backdrop-blur-sm border-2 border-primary/30 p-1 mb-8">
                  <TabsTrigger value="predict" className="font-display text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    📊 Predict
                  </TabsTrigger>
                  <TabsTrigger value="fixtures" className="font-display text-lg data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                    📅 Fixtures
                  </TabsTrigger>
                  <TabsTrigger 
                    value="status" 
                    className="font-display text-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                    onClick={fetchModelStatus}
                  >
                    ⚙️ Status
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="predict" className="space-y-6">
                  {!authenticated ? (
                    <LoginPrompt title="Predict Locked" />
                  ) : (
                    <StadiumCard title="Predict the Group Stage">
                      <p className="text-sm text-muted-foreground mb-4">
                        Pick a Home / Draw / Away outcome for every match in a WC2026 group.
                        Each pick stays editable right up until that match kicks off.
                      </p>

                      <div className="mb-6 max-w-xs">
                        <label className="block text-sm font-display text-muted-foreground mb-1">
                          Group
                        </label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                          <SelectTrigger className="bg-card/60 border-secondary/30">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            {WC2026_GROUP_NAMES.map((g) => {
                              const saved = myPredictions.filter((p) => p.group_name === g).length;
                              return (
                                <SelectItem key={g} value={g}>
                                  {g}
                                  {saved > 0 && (
                                    <span className="ml-2 text-xs text-green-400">
                                      · {saved} saved
                                    </span>
                                  )}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {!myPredictionsLoaded ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                        </div>
                      ) : (
                        <GroupPredictPanel
                          groupName={selectedGroup}
                          myPicksForGroup={myPredictions.filter(
                            (p) => p.group_name === selectedGroup,
                          )}
                          onSaved={setMyPredictions}
                        />
                      )}
                    </StadiumCard>
                  )}
                </TabsContent>

                <TabsContent value="fixtures">
                  {!authenticated ? (
                    <LoginPrompt title="Fixtures Locked" />
                  ) : (
                    <StadiumCard title="Fixtures · Next 7 Days">
                      {fixturesLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                        </div>
                      ) : fixtures.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No FIFA World Cup 2026 matches scheduled in the next 7 days.
                        </p>
                      ) : (
                        <div className="space-y-6">
                          {groupFixturesByDate(fixtures).map(([dateISO, dayFixtures]) => (
                            <div key={dateISO}>
                              <h3 className="font-display text-lg text-secondary mb-3 border-b border-secondary/20 pb-1">
                                {formatDateHeading(dateISO)}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">
                                  {dayFixtures.length} {dayFixtures.length === 1 ? 'match' : 'matches'}
                                </span>
                              </h3>
                              <div className="space-y-3">
                                {dayFixtures.map((fx) => (
                                  <FixtureCard
                                    key={fx.id}
                                    id={fx.id}
                                    homeTeam={fx.home_team}
                                    awayTeam={fx.away_team}
                                    date={fx.match_date}
                                    time={fx.kickoff_time || 'TBD'}
                                    venue={fx.venue || undefined}
                                    groupLabel={fx.group_name || undefined}
                                    result={
                                      (fx.status === 'completed' || fx.status === 'live') &&
                                      fx.home_goals != null &&
                                      fx.away_goals != null
                                        ? {
                                            homeGoals: fx.home_goals,
                                            awayGoals: fx.away_goals,
                                            status: fx.status,
                                          }
                                        : undefined
                                    }
                                    prediction={
                                      fx.prediction
                                        ? {
                                            homeWin: fx.prediction.home_win,
                                            draw: fx.prediction.draw,
                                            awayWin: fx.prediction.away_win,
                                            predicted: fx.prediction.predicted,
                                          }
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </StadiumCard>
                  )}
                </TabsContent>

                <TabsContent value="status">
                  {!authenticated ? (
                    <LoginPrompt title="Model Status Locked" />
                  ) : (
                    <StadiumCard title="Model Status">
                      {statusLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">
                            {modelStatus?.status === 'ready' ? '✅' : modelStatus?.status === 'offline' ? '❌' : '🤖'}
                          </div>
                          <p className="text-xl text-secondary font-display capitalize">
                            {modelStatus?.status || 'Click to check status'}
                          </p>
                          {modelStatus?.accuracy && (
                            <p className="text-muted-foreground mt-2">
                              Accuracy: {(modelStatus.accuracy * 100).toFixed(1)}%
                            </p>
                          )}
                          {modelStatus?.last_trained && (
                            <p className="text-muted-foreground mt-1">
                              Last trained: {modelStatus.last_trained}
                            </p>
                          )}
                          {modelStatus?.total_predictions && (
                            <p className="text-muted-foreground mt-1">
                              Total predictions: {modelStatus.total_predictions.toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground/70 mt-4">
                            Backend: {API_HOST_LABEL}
                          </p>
                        </div>
                      )}
                    </StadiumCard>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-8">
                <TwitterSidebar twitterHandle="FIFAWorldCup" />
              </div>
              <SponsorBanner />
            </main>

            <SponsorPlaceholder side="right" />
          </div>
        </div>
        <Footer />
      </div>
  );
};

export default Index;