import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

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

const MOCK_FIXTURES = [
  { homeTeam: 'Kaizer Chiefs', awayTeam: 'Orlando Pirates', date: '2024-03-15', time: '15:30', venue: 'FNB Stadium', isHotMatch: true },
  { homeTeam: 'Mamelodi Sundowns', awayTeam: 'AmaZulu FC', date: '2024-03-16', time: '17:00', venue: 'Loftus Versfeld' },
  { homeTeam: 'Cape Town City', awayTeam: 'SuperSport United', date: '2024-03-17', time: '15:00', venue: 'Cape Town Stadium' },
];

const Index = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
    // Simulate API call - replace with your actual backend
    setTimeout(() => {
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
      setIsLoading(false);
    }, 1500);
  };

  return (
    <SoundProvider>
      <div className="min-h-screen stadium-gradient relative overflow-hidden">
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
              <TabsTrigger value="status" className="font-display text-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
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
                <div className="space-y-4">
                  {MOCK_FIXTURES.map((fixture, i) => (
                    <FixtureCard key={i} {...fixture} prediction={{ homeWin: 0.45, draw: 0.25, awayWin: 0.30, predicted: 'Home Win' }} />
                  ))}
                </div>
              </StadiumCard>
            </TabsContent>

            <TabsContent value="status">
              <StadiumCard title="Model Status">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🤖</div>
                  <p className="text-xl text-secondary font-display">AI Model Ready</p>
                  <p className="text-muted-foreground mt-2">Connect to your backend at localhost:8000</p>
                </div>
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