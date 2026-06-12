import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserFeedbackModal } from './UserFeedbackModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FixtureCardProps {
  id?: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue?: string;
  prediction?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    predicted: string;
  };
  isHotMatch?: boolean;
  /**
   * Optional live/final scoreline. When `status === 'completed'` the card
   * renders a "Final H–A" chip; when 'live', a pulsing "Live H–A" chip.
   * Scheduled matches should omit this prop entirely.
   */
  result?: {
    homeGoals: number;
    awayGoals: number;
    status: 'live' | 'completed';
  };
  /** Optional context badge, e.g. "Group A" — rendered next to the date. */
  groupLabel?: string;
}

export const FixtureCard = ({
  id = 0,
  homeTeam,
  awayTeam,
  date,
  time,
  venue,
  prediction,
  isHotMatch,
  result,
  groupLabel,
}: FixtureCardProps) => {
  // For completed matches, surface whether our pre-match prediction was
  // correct as a ✓/✗ next to the predicted-outcome badge. Returns null
  // when we can't tell (missing prediction or pre-result card).
  const predictionCorrect = (() => {
    if (!result || result.status !== 'completed' || !prediction) return null;
    const actual =
      result.homeGoals > result.awayGoals ? 'Home Win'
      : result.homeGoals < result.awayGoals ? 'Away Win'
      : 'Draw';
    return prediction.predicted === actual;
  })();
  return (
    <Card 
      className={cn(
        'relative overflow-hidden p-4',
        'bg-card/60 backdrop-blur-sm',
        'border-2 border-primary/20',
        'hover:border-secondary/50 transition-all duration-300',
        'hover:shadow-lg hover:shadow-secondary/20',
        isHotMatch && 'ring-2 ring-accent/50'
      )}
    >
      {/* Ticket-style dashed border */}
      <div className="absolute left-0 top-0 bottom-0 w-2 border-r-2 border-dashed border-secondary/30" />
      <div className="absolute right-0 top-0 bottom-0 w-2 border-l-2 border-dashed border-secondary/30" />

      {/* Hot match badge */}
      {isHotMatch && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="absolute top-2 right-4 bg-accent text-accent-foreground animate-pulse cursor-help">
              🔥 Hot Match
            </Badge>
          </TooltipTrigger>
          <TooltipContent>High-stakes fixture trending with fans this week</TooltipContent>
        </Tooltip>
      )}

      <div className="pl-4 pr-4">
        {/* Teams */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <span className="font-display text-lg text-foreground">{homeTeam}</span>
          </div>
          <div className="px-4">
            {result ? (
              <span
                className={cn(
                  'font-display text-2xl font-bold tabular-nums',
                  result.status === 'live' ? 'text-red-400 animate-pulse' : 'text-accent',
                )}
              >
                {result.homeGoals}–{result.awayGoals}
              </span>
            ) : (
              <span className="font-display text-2xl text-secondary">VS</span>
            )}
          </div>
          <div className="flex-1 text-right">
            <span className="font-display text-lg text-foreground">{awayTeam}</span>
          </div>
        </div>

        {/* Status chip for live/completed matches sits just above the
            date row so the scoreline above doesn't need to be re-explained. */}
        {result && (
          <div className="flex justify-center mb-2">
            {result.status === 'completed' ? (
              <Badge
                variant="outline"
                className="text-accent border-accent/40 bg-accent/10"
              >
                Final
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-red-400 border-red-500/40 bg-red-500/10 animate-pulse"
              >
                ● Live
              </Badge>
            )}
          </div>
        )}

        {/* Date, Time, optional Group */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
          <span>📅 {date}</span>
          <span>⏰ {time}</span>
          {groupLabel && (
            <span className="px-2 py-0.5 rounded border border-border text-xs">
              {groupLabel}
            </span>
          )}
        </div>

        {venue && (
          <div className="text-center text-sm text-muted-foreground">
            🏟️ {venue}
          </div>
        )}

        {/* Prediction preview and feedback */}
        {prediction && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex gap-2 cursor-help">
                    <span className="text-primary">{(prediction.homeWin * 100).toFixed(0)}%</span>
                    <span className="text-secondary">{(prediction.draw * 100).toFixed(0)}%</span>
                    <span className="text-accent">{(prediction.awayWin * 100).toFixed(0)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Home win • Draw • Away win probabilities from our AI</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      'cursor-help',
                      predictionCorrect === true
                        ? 'text-green-400 border-green-500/50'
                        : predictionCorrect === false
                        ? 'text-red-400 border-red-500/50'
                        : 'text-secondary border-secondary/50',
                    )}
                  >
                    📊 {prediction.predicted}
                    {predictionCorrect === true && <span className="ml-1">✓</span>}
                    {predictionCorrect === false && <span className="ml-1">✗</span>}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {result?.status === 'completed'
                    ? 'Our pre-match pick — ✓/✗ vs the final result'
                    : 'Our most likely outcome based on team form'}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* User Feedback Button */}
        <div className="mt-3 flex justify-center">
          <UserFeedbackModal 
            fixtureId={id} 
            homeTeam={homeTeam} 
            awayTeam={awayTeam} 
          />
        </div>
      </div>
    </Card>
  );
};
