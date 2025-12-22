import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Confetti } from '@/components/Confetti';
import { FloatingElements } from '@/components/FloatingElements';
import { HeroSection } from '@/components/HeroSection';
import { StadiumCard } from '@/components/StadiumCard';
import { TeamSelector } from '@/components/TeamSelector';
import { VuvuzelaButton } from '@/components/VuvuzelaButton';
import { PredictionResult } from '@/components/PredictionResult';
import { FixtureCard } from '@/components/FixtureCard';
import { Footer } from '@/components/Footer';
import { SoundToggle, SoundProvider } from '@/components/SoundToggle';
import { NavHeader } from '@/components/NavHeader';
import { useToast } from '@/hooks/use-toast';
import { getPrediction, getFixtures, getModelStatus, Fixture, ModelStatus } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const PSL_TEAMS = [
  { name: 'Kaizer Chiefs', value: 'kaizer_chiefs' },
  { name: 'Orlando Pirates', value: 'orlando_pirates' },
  { name: 'Mamelodi Sundowns', value: 'mamelodi_sundowns' },
  { name: 'AmaZulu FC', value: 'amazulu' },
  { name: 'Cape Town City', value: 'cape_town_city' },
  { name: 'SuperSport United', value: 'supersport_united' },
  { name: 'Golden Arrows', value: 'golden_arrows' },
  { name: 'Stellenbosch FC', value: 'stellenbosch' },
];

const Index = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { toast } = useToast();

  // Fetch fixtures on mount
  useEffect(() => {
    const fetchFixtures = async () => {
      setFixturesLoading(true);
      try {
        const data = await getFixtures();
        setFixtures(data);
      } catch (error) {
        console.log('Backend not available, using mock data');
        // Fallback mock data
        setFixtures([
          { id: 1, home_team: 'Kaizer Chiefs', away_team: 'Orlando Pirates', date: '2024-03-15', time: '15:30', venue: 'FNB Stadium', is_hot_match: true },
          { id: 2, home_team: 'Mamelodi Sundowns', away_team: 'AmaZulu FC', date: '2024-03-16', time: '17:00', venue: 'Loftus Versfeld' },
          { id: 3, home_team: 'Cape Town City', away_team: 'SuperSport United', date: '2024-03-17', time: '15:00', venue: 'Cape Town Stadium' },
        ]);
      } finally {
        setFixturesLoading(false);
      }
    };
    fetchFixtures();
  }, []);

  // Fetch model status
  const fetchModelStatus = async () => {
    setStatusLoading(true);
    try {
      const data = await getModelStatus();
      setModelStatus(data);
    } catch (error) {
      setModelStatus({ status: 'offline', accuracy: undefined, last_trained: undefined });
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
      const result = await getPrediction(homeTeam, awayTeam);
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
      toast({ 
        title: 'Connection Error', 
        description: 'Could not connect to backend. Make sure FastAPI is running on localhost:8000', 
        variant: 'destructive' 
      });
      // Fallback mock prediction
      const homeWin = Math.random() * 0.5 + 0.2;
      const draw = Math.random() * 0.3;
      const awayWin = 1 - homeWin - draw;
      const max = Math.max(homeWin, draw, awayWin);
      setPrediction({
        homeTeam: PSL_TEAMS.find(t => t.value === homeTeam)?.name,
        awayTeam: PSL_TEAMS.find(t => t.value === awayTeam)?.name,
        homeWin, draw, awayWin,
        prediction: max === homeWin ? 'Home Win' : max === draw ? 'Draw' : 'Away Win',
        confidence: max > 0.5 ? 'High' : max > 0.4 ? 'Medium' : 'Low',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SoundProvider>
      <div className="min-h-screen stadium-gradient relative overflow-hidden">
        <NavHeader />
        <Confetti />
        <FloatingElements />
        <SoundToggle />
        
        <HeroSection />

        <main className="container mx-auto px-4 py-8 relative z-10">
          <Tabs defaultValue="predict" className="w-full max-w-4xl mx-auto">
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
              <StadiumCard title="Single Match Prediction">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <TeamSelector teams={PSL_TEAMS} value={homeTeam} onChange={setHomeTeam} label="Home Team" placeholder="Select home team" />
                  <TeamSelector teams={PSL_TEAMS} value={awayTeam} onChange={setAwayTeam} label="Away Team" placeholder="Select away team" />
                </div>
                <div className="flex justify-center">
                  <VuvuzelaButton onClick={handlePredict} isLoading={isLoading} className="px-12 py-6 text-xl">
                    Get Prediction
                  </VuvuzelaButton>
                </div>
              </StadiumCard>

              {prediction && <PredictionResult {...prediction} />}
            </TabsContent>

            <TabsContent value="fixtures">
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
            </TabsContent>

            <TabsContent value="status">
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
                      Backend: localhost:8000
                    </p>
                  </div>
                )}
              </StadiumCard>
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </SoundProvider>
  );
};

export default Index;