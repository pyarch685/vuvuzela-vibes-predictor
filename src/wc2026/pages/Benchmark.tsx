import { useState, useEffect, useCallback } from 'react';
import { StadiumCard } from '@wc/components/StadiumCard';
import { NavHeader } from '@wc/components/NavHeader';
import { Footer } from '@wc/components/Footer';
import { FloatingElements } from '@wc/components/FloatingElements';
import { SponsorPlaceholder } from '@wc/components/SponsorPlaceholder';
import { SponsorBanner } from '@wc/components/SponsorBanner';
import { LoginPrompt } from '@wc/components/LoginPrompt';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  getWc2026BenchmarkResults,
  triggerScrapeRefresh,
  isAuthenticated,
  type Wc2026BenchmarkSummary,
  type Wc2026BenchmarkMatch,
  type Wc2026ModelEvaluation,
} from '@wc/lib/api';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const Benchmark = () => {
  const [summary, setSummary] = useState<Wc2026BenchmarkSummary | null>(null);
  const [matches, setMatches] = useState<Wc2026BenchmarkMatch[]>([]);
  const [holdout, setHoldout] = useState<Wc2026ModelEvaluation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!isAuthenticated()) {
      setAuthenticated(false);
      setSummary(null);
      setMatches([]);
      setHoldout(null);
      setMessage(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getWc2026BenchmarkResults();
      setAuthenticated(true);
      setSummary(data.summary);
      setMatches(data.matches);
      setHoldout(data.holdout);
      setMessage(data.message ?? null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load benchmark data';
      if (errorMessage.includes('Session expired') || errorMessage.includes('Authentication required')) {
        setAuthenticated(false);
        setSummary(null);
        setMatches([]);
        setHoldout(null);
        setError(null);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      toast({
        title: 'Refreshing...',
        description: 'Scraping FIFA.com for latest WC 2026 results.',
      });
      // The scrape refresh kicks off the WC fixtures scraper; the
      // hourly snapshot/backfill scheduler jobs catch up within a few
      // minutes. Reload the benchmark right away so any pending
      // snapshots already inserted by the previous tick are visible.
      await triggerScrapeRefresh(true);
      await fetchData();
      toast({ title: 'Data refreshed', description: 'Benchmark results updated.' });
    } catch (err) {
      toast({
        title: 'Refresh failed',
        description: err instanceof Error ? err.message : 'Could not trigger scrape',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const snapshotKindBadge = (kind: string) => {
    if (kind === 'pre_match') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="bg-primary/15 text-primary border-primary/30 cursor-help"
            >
              pre-match
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Snapshot taken before kickoff. Honest pre-match probability.
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="bg-muted text-muted-foreground border-border cursor-help"
          >
            retroactive
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          Snapshotted after kickoff using the un-retrained pre-tournament artifact.
        </TooltipContent>
      </Tooltip>
    );
  };

  // Headline accuracy: live if we have any resolved row, else holdout.
  const hasLive = (summary?.total_matches ?? 0) > 0;
  const headlineLabel = hasLive ? 'Live tournament accuracy' : 'Model holdout accuracy';
  const headlineValue = hasLive
    ? (summary?.accuracy ?? 0)
    : (holdout?.accuracy ?? 0);
  const headlineSubtitle = hasLive
    ? `${summary?.correct ?? 0} / ${summary?.total_matches ?? 0} correct`
    : holdout
      ? `Training-time holdout (n=${holdout.n_matches})`
      : 'No data yet';

  const preMatchKind = summary?.accuracy_by_kind.find((k) => k.snapshot_kind === 'pre_match');
  const retroKind = summary?.accuracy_by_kind.find((k) => k.snapshot_kind === 'retroactive');

  return (
    <div className="min-h-screen stadium-gradient relative overflow-hidden">
      <NavHeader />
      <FloatingElements />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-center gap-6 items-stretch">
          <SponsorPlaceholder side="left" />

          <main className="w-full max-w-5xl flex flex-col space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-2">
              <h1 className="font-display text-4xl md:text-5xl text-secondary">
                📊 WC 2026 Performance Benchmark
              </h1>
              <p className="text-muted-foreground text-lg">
                Davidson-Bradley-Terry model predictions vs actual{' '}
                <a
                  href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary underline hover:text-secondary/80"
                >
                  FIFA WC 2026
                </a>{' '}
                results.
              </p>
              <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                Pre-match snapshots are captured before kickoff. Matches that
                played before this benchmark went live are scored
                retroactively against the un-retrained pre-tournament artifact
                and flagged as such.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/wc2026')} className="text-muted-foreground hover:text-foreground">
                  ← Back to Predictor
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2 border-secondary/50 hover:bg-secondary/10"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh data
                </Button>
              </div>
            </div>

            {!authenticated ? (
              <LoginPrompt title="Benchmark Locked" />
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-secondary" />
              </div>
            ) : error ? (
              <StadiumCard title="Error">
                <div className="text-center py-8">
                  <p className="text-destructive text-lg">{error}</p>
                  <p className="text-muted-foreground mt-2">
                    Make sure the backend is running and the /wc2026/benchmark endpoint is available.
                  </p>
                </div>
              </StadiumCard>
            ) : (
              <>
                {message && (
                  <StadiumCard title="Status">
                    <p className="text-sm text-muted-foreground text-center">
                      {message}
                    </p>
                  </StadiumCard>
                )}

                {/* Headline + Breakdown + Holdout */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StadiumCard title={headlineLabel} glowing>
                      <div className="text-center space-y-4">
                        <div className="text-5xl font-display text-secondary">
                          {(headlineValue * 100).toFixed(1)}%
                        </div>
                        <Progress value={headlineValue * 100} className="h-3" />
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Target className="h-4 w-4" />
                          <span>{headlineSubtitle}</span>
                        </div>
                        {hasLive && (preMatchKind || retroKind) && (
                          <div className="text-xs text-muted-foreground">
                            {preMatchKind ? `${preMatchKind.total} pre-match` : '0 pre-match'}
                            {' + '}
                            {retroKind ? `${retroKind.total} retroactive` : '0 retroactive'}
                          </div>
                        )}
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

                    <StadiumCard title="Model Holdout">
                      {holdout ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className="text-secondary">
                              {(holdout.accuracy * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Log loss</span>
                            <span className="text-secondary">
                              {holdout.log_loss.toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Brier</span>
                            <span className="text-secondary">
                              {holdout.brier.toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">n matches</span>
                            <span className="text-secondary">{holdout.n_matches}</span>
                          </div>
                          <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                            {holdout.evaluation_kind === 'in_sample_recomputed'
                              ? 'Recomputed at runtime from H2H dataset.'
                              : 'Baked in at training time.'}
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4 text-sm">
                          Holdout metrics unavailable.
                        </p>
                      )}
                    </StadiumCard>
                  </div>
                )}

                {/* Pre-match vs Retroactive split */}
                {summary && summary.accuracy_by_kind.length > 0 && (
                  <StadiumCard title="Pre-match vs Retroactive">
                    <div className="space-y-3">
                      {summary.accuracy_by_kind.map((row) => (
                        <div key={row.snapshot_kind} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2">
                              {snapshotKindBadge(row.snapshot_kind)}
                              <span>
                                {row.correct} / {row.total} correct
                              </span>
                            </span>
                            <span className="text-secondary">
                              {(row.accuracy * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={row.accuracy * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </StadiumCard>
                )}

                {/* Confidence buckets */}
                {summary && summary.accuracy_by_confidence.length > 0 && (
                  <StadiumCard title="Confidence Accuracy">
                    <div className="space-y-3">
                      {summary.accuracy_by_confidence.map((item) => (
                        <div key={item.confidence} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.confidence}{' '}
                              <span className="text-xs">({item.count})</span>
                            </span>
                            <span className="text-secondary">
                              {(item.accuracy * 100).toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={item.accuracy * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </StadiumCard>
                )}

                {/* Performance Over Time */}
                {summary && summary.accuracy_by_period.length > 0 && (
                  <StadiumCard title="Performance Over Time">
                    <ChartContainer
                      config={{
                        accuracy: {
                          label: 'Accuracy',
                          color: 'hsl(var(--primary))',
                        },
                      }}
                      className="h-[280px] w-full"
                    >
                      <LineChart
                        data={summary.accuracy_by_period.map((p) => ({
                          period: p.period,
                          accuracy: Math.round(p.accuracy * 1000) / 10,
                        }))}
                        margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(v: number) => [`${v}%`, 'Accuracy']}
                            />
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          stroke="var(--color-accuracy)"
                          strokeWidth={2}
                          dot={{ fill: 'var(--color-accuracy)', r: 4 }}
                          connectNulls
                        />
                      </LineChart>
                    </ChartContainer>
                  </StadiumCard>
                )}

                {/* Match-by-Match Table */}
                <StadiumCard title="Match-by-Match Results">
                  {matches.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No resolved WC 2026 matches yet. Once the scheduler
                      snapshots the next batch and FIFA publishes results,
                      they will appear here.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="text-secondary">Date</TableHead>
                            <TableHead className="text-secondary">Match</TableHead>
                            <TableHead className="text-secondary">Stage</TableHead>
                            <TableHead className="text-secondary">Predicted</TableHead>
                            <TableHead className="text-secondary">Actual</TableHead>
                            <TableHead className="text-secondary">Score</TableHead>
                            <TableHead className="text-secondary">Snapshot</TableHead>
                            <TableHead className="text-secondary text-center">Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matches.map((match) => (
                            <TableRow
                              key={match.id}
                              className={`border-border ${
                                match.correct === true
                                  ? 'bg-primary/5'
                                  : match.correct === false
                                    ? 'bg-destructive/5'
                                    : ''
                              }`}
                            >
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {match.match_date}
                                {match.kickoff_time ? (
                                  <span className="block text-xs text-muted-foreground/70">
                                    {match.kickoff_time}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="font-medium">
                                <span className="text-foreground">{match.home_team}</span>
                                <span className="text-muted-foreground mx-1">vs</span>
                                <span className="text-foreground">{match.away_team}</span>
                                {match.group_name ? (
                                  <span className="block text-xs text-muted-foreground/70">
                                    {match.group_name}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {match.stage.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{outcomeBadge(match.predicted_outcome)}</TableCell>
                              <TableCell>
                                {match.actual_outcome
                                  ? outcomeBadge(match.actual_outcome)
                                  : <span className="text-muted-foreground">Pending</span>}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {match.actual_score || '—'}
                              </TableCell>
                              <TableCell>{snapshotKindBadge(match.snapshot_kind)}</TableCell>
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
            <SponsorBanner />
          </main>

          <SponsorPlaceholder side="right" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Benchmark;
