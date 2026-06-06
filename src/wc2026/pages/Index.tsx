import { useState, useEffect, useRef } from 'react';
import { devLog, devError } from '@wc/lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Confetti } from '@wc/components/Confetti';
import { FloatingElements } from '@wc/components/FloatingElements';
import { HeroSection } from '@wc/components/HeroSection';
import { StadiumCard } from '@wc/components/StadiumCard';
import { TeamSelector } from '@wc/components/TeamSelector';
import { PredictionResult } from '@wc/components/PredictionResult';
import { FixtureCard } from '@wc/components/FixtureCard';
import { Footer } from '@wc/components/Footer';
import { NavHeader } from '@wc/components/NavHeader';
import { TwitterSidebar } from '@wc/components/TwitterSidebar';
import { SponsorPlaceholder } from '@wc/components/SponsorPlaceholder';
import { SponsorBanner } from '@wc/components/SponsorBanner';
import { LoginPrompt } from '@wc/components/LoginPrompt';
import { useToast } from '@/hooks/use-toast';
import { getPrediction, getFixtures, getModelStatus, getTeams, Fixture, ModelStatus, Team, isAuthenticated, API_HOST_LABEL } from '@wc/lib/api';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const { toast } = useToast();

  // Fetch teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        const data = await getTeams();
        setTeams(data);
      } catch (error) {
        devLog('Backend not available, using fallback teams');
        // Fallback teams if backend unavailable
        setTeams([
          { name: 'Algeria', value: 'algeria' },
          { name: 'Argentina', value: 'argentina' },
          { name: 'Australia', value: 'australia' },
          { name: 'Austria', value: 'austria' },
          { name: 'Belgium', value: 'belgium' },
          { name: 'Bosnia and Herzegovina', value: 'bosnia_and_herzegovina' },
          { name: 'Brazil', value: 'brazil' },
          { name: 'Canada', value: 'canada' },
          { name: 'Cabo Verde', value: 'cabo_verde' },
          { name: 'Colombia', value: 'colombia' },
          { name: 'Croatia', value: 'croatia' },
          { name: 'Curacao', value: 'curacao' },
          { name: 'Czechia', value: 'czechia' },
          { name: 'Congo DR', value: 'congo_dr' },
          { name: 'Ecuador', value: 'ecuador' },
          { name: 'Egypt', value: 'egypt' },
          { name: 'England', value: 'england' },
          { name: 'France', value: 'france' },
          { name: 'Germany', value: 'germany' },
          { name: 'Ghana', value: 'ghana' },
          { name: 'Haiti', value: 'haiti' },
          { name: 'IR Iran', value: 'ir_iran' },
          { name: 'Iraq', value: 'iraq' },
          { name: "Côte d'Ivoire", value: 'cote_divoire' },
          { name: 'Japan', value: 'japan' },
          { name: 'Jordan', value: 'jordan' },
          { name: 'Mexico', value: 'mexico' },
          { name: 'Morocco', value: 'morocco' },
          { name: 'Netherlands', value: 'netherlands' },
          { name: 'New Zealand', value: 'new_zealand' },
          { name: 'Norway', value: 'norway' },
          { name: 'Panama', value: 'panama' },
          { name: 'Paraguay', value: 'paraguay' },
          { name: 'Portugal', value: 'portugal' },
          { name: 'Qatar', value: 'qatar' },
          { name: 'Saudi Arabia', value: 'saudi_arabia' },
          { name: 'Scotland', value: 'scotland' },
          { name: 'Senegal', value: 'senegal' },
          { name: 'South Africa', value: 'south_africa' },
          { name: 'Korea Republic', value: 'korea_republic' },
          { name: 'Spain', value: 'spain' },
          { name: 'Sweden', value: 'sweden' },
          { name: 'Switzerland', value: 'switzerland' },
          { name: 'Tunisia', value: 'tunisia' },
          { name: 'Türkiye', value: 'turkiye' },
          { name: 'USA', value: 'usa' },
          { name: 'Uruguay', value: 'uruguay' },
          { name: 'Uzbekistan', value: 'uzbekistan' },
        ]);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, []);

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
        const data = await getFixtures(90, 5); // Get next 5 fixtures (90 days to catch future fixtures)
        if (mounted) {
          setFixtures(data);
          devLog('Fixtures loaded successfully:', data.length);
        }
      } catch (error) {
        devError('Failed to fetch fixtures:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load fixtures';
        if (mounted) {
          hasFetchedRef.current = false; // Allow retry on error
          if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
            setFixtures([]);
            // User needs to log in - fixtures will be empty
          } else {
            // Other error - show empty state
            setFixtures([]);
          }
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

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) {
      toast({ title: 'Eish!', description: 'Please select both teams', variant: 'destructive' });
      return;
    }
    if (homeTeam === awayTeam) {
      toast({ title: 'Haibo!', description: 'Teams cannot be the same', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // Get team names from teams list
      const homeTeamName = teams.find(t => t.value === homeTeam)?.name || homeTeam;
      const awayTeamName = teams.find(t => t.value === awayTeam)?.name || awayTeam;
      
      const result = await getPrediction(homeTeamName, awayTeamName);
      setPrediction({
        homeTeam: result.home_team,
        awayTeam: result.away_team,
        homeWin: result.home_win,
        draw: result.draw,
        awayWin: result.away_win,
        prediction: result.prediction,
        confidence: result.confidence,
      });
    } catch (error) {
      // NEVER surface fake probabilities to users — clear any previous
      // prediction and let the user retry.
      setPrediction(null);
      toast({
        title: 'Prediction unavailable',
        description: 'Could not reach the prediction service. Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                    <>
                      <StadiumCard title="Single Match Prediction">
                        {teamsLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                          </div>
                        ) : (
                          <>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              <TeamSelector teams={teams} value={homeTeam} onChange={setHomeTeam} label="Home Team" placeholder="Select home team" />
                              <TeamSelector teams={teams} value={awayTeam} onChange={setAwayTeam} label="Away Team" placeholder="Select away team" />
                            </div>
                            <div className="flex justify-center">
                              <Button 
                                onClick={handlePredict} 
                                disabled={isLoading || teamsLoading || teams.length === 0}
                                className="px-12 py-6 text-xl relative overflow-hidden transition-all duration-300 bg-gradient-to-r from-secondary via-accent to-secondary hover:from-accent hover:via-secondary hover:to-accent text-secondary-foreground font-display font-bold shadow-lg hover:shadow-xl hover:shadow-secondary/30 border-2 border-secondary/50"
                              >
                                <span className="relative z-10 flex items-center gap-2">
                                  {isLoading ? (
                                    <>
                                      <span className="animate-spin">⚽</span>
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      📣 Get Prediction
                                    </>
                                  )}
                                </span>
                              </Button>
                            </div>
                          </>
                        )}
                      </StadiumCard>

                      {prediction && <PredictionResult {...prediction} />}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="fixtures">
                  {!authenticated ? (
                    <LoginPrompt title="Fixtures Locked" />
                  ) : (
                    <StadiumCard title="Upcoming Fixtures">
                      {fixturesLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {fixtures.map((fixture) => (
                            <FixtureCard 
                              key={fixture.id} 
                              id={fixture.id}
                              homeTeam={fixture.home_team} 
                              awayTeam={fixture.away_team}
                              date={fixture.date}
                              time={fixture.time}
                              venue={fixture.venue}
                              isHotMatch={fixture.is_hot_match}
                              prediction={fixture.prediction ? {
                                homeWin: fixture.prediction.home_win,
                                draw: fixture.prediction.draw,
                                awayWin: fixture.prediction.away_win,
                                predicted: fixture.prediction.predicted,
                              } : undefined}
                            />
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