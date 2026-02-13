import { useState, useEffect } from 'react';
import { StadiumCard } from '@/components/StadiumCard';
import { NavHeader } from '@/components/NavHeader';
import { Footer } from '@/components/Footer';
import { SoundProvider } from '@/components/SoundToggle';
import { FloatingElements } from '@/components/FloatingElements';
import { getBenchmarkResults, BenchmarkSummary, BenchmarkMatch } from '@/lib/api';
import { Loader2, CheckCircle2, XCircle, MinusCircle, TrendingUp, BarChart3, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Benchmark = () => {
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [matches, setMatches] = useState<BenchmarkMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBenchmarkResults();
        setSummary(data.summary);
        setMatches(data.matches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load benchmark data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const outcomeIcon = (correct: boolean | null) => {
    if (correct === null) return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
    return correct 
      ? <CheckCircle2 className="h-5 w-5 text-primary" />
      : <XCircle className="h-5 w-5 text-destructive" />;
  };

  const outcomeBadge = (outcome: string) => {
    const variants: Record<string, string> = {
      'Home Win': 'bg-primary/20 text-primary border-primary/30',
      'Draw': 'bg-secondary/20 text-secondary border-secondary/30',
      'Away Win': 'bg-accent/20 text-accent border-accent/30',
    };
    return (
      <Badge variant="outline" className={variants[outcome] || 'bg-muted text-muted-foreground'}>
        {outcome}
      </Badge>
    );
  };

  return (
    <SoundProvider>
      <div className="min-h-screen stadium-gradient relative overflow-hidden">
        <NavHeader />
        <FloatingElements />

        <main className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-secondary">
                📊 Performance Benchmark
              </h1>
              <p className="text-muted-foreground text-lg">
                Predictions vs Real PSL Results from{' '}
                <a href="https://www.psl.co.za" target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:text-secondary/80">
                  psl.co.za
                </a>
              </p>
              <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
                ← Back to Predictor
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-secondary" />
              </div>
            ) : error ? (
              <StadiumCard title="Error">
                <div className="text-center py-8">
                  <p className="text-destructive text-lg">{error}</p>
                  <p className="text-muted-foreground mt-2">
                    Make sure the backend is running and the /benchmark endpoint is available.
                  </p>
                </div>
              </StadiumCard>
            ) : (
              <>
                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StadiumCard title="Overall Accuracy" glowing>
                      <div className="text-center space-y-4">
                        <div className="text-5xl font-display text-secondary">
                          {(summary.accuracy * 100).toFixed(1)}%
                        </div>
                        <Progress value={summary.accuracy * 100} className="h-3" />
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>{summary.correct} / {summary.total_matches} correct</span>
                        </div>
                      </div>
                    </StadiumCard>

                    <StadiumCard title="Breakdown">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-primary flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Correct
                          </span>
                          <span className="font-display text-xl text-primary">{summary.correct}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-destructive flex items-center gap-2">
                            <XCircle className="h-4 w-4" /> Incorrect
                          </span>
                          <span className="font-display text-xl text-destructive">{summary.incorrect}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <MinusCircle className="h-4 w-4" /> Pending
                          </span>
                          <span className="font-display text-xl text-muted-foreground">{summary.pending}</span>
                        </div>
                      </div>
                    </StadiumCard>

                    <StadiumCard title="Confidence Accuracy">
                      <div className="space-y-3">
                        {summary.accuracy_by_confidence?.map((item) => (
                          <div key={item.confidence} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{item.confidence}</span>
                              <span className="text-secondary">{(item.accuracy * 100).toFixed(0)}%</span>
                            </div>
                            <Progress value={item.accuracy * 100} className="h-2" />
                          </div>
                        ))}
                        {!summary.accuracy_by_confidence?.length && (
                          <p className="text-muted-foreground text-center py-4">No data yet</p>
                        )}
                      </div>
                    </StadiumCard>
                  </div>
                )}

                {/* Match-by-Match Table */}
                <StadiumCard title="Match-by-Match Results">
                  {matches.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No benchmark matches available yet. Results will appear once matches are played and scraped from psl.co.za.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-secondary">Date</TableHead>
                            <TableHead className="text-secondary">Match</TableHead>
                            <TableHead className="text-secondary">Predicted</TableHead>
                            <TableHead className="text-secondary">Actual</TableHead>
                            <TableHead className="text-secondary">Score</TableHead>
                            <TableHead className="text-secondary text-center">Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matches.map((match, idx) => (
                            <TableRow 
                              key={match.id || idx} 
                              className={`border-border ${match.correct === true ? 'bg-primary/5' : match.correct === false ? 'bg-destructive/5' : ''}`}
                            >
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {match.date}
                              </TableCell>
                              <TableCell className="font-medium">
                                <span className="text-foreground">{match.home_team}</span>
                                <span className="text-muted-foreground mx-1">vs</span>
                                <span className="text-foreground">{match.away_team}</span>
                              </TableCell>
                              <TableCell>{outcomeBadge(match.predicted_outcome)}</TableCell>
                              <TableCell>
                                {match.actual_outcome 
                                  ? outcomeBadge(match.actual_outcome)
                                  : <span className="text-muted-foreground">Pending</span>
                                }
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {match.actual_score || '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {outcomeIcon(match.correct)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </StadiumCard>
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </SoundProvider>
  );
};

export default Benchmark;
