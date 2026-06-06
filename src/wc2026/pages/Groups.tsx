import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavHeader } from "@wc/components/NavHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, RefreshCw } from "lucide-react";
import { getGroupStandings, verifyPaystackPayment, isAuthenticated, type GroupStandingTeam } from "@wc/lib/api";
import { GroupPredictions } from "@wc/components/GroupPredictions";
import { LoginPrompt } from "@wc/components/LoginPrompt";
import { useToast } from "@/hooks/use-toast";

// Static team rosters — used as a fallback when the backend hasn't returned
// standings yet (e.g. before the tournament starts or when the scraper is down).
const STATIC_GROUPS: Record<string, string[]> = {
  "Group A": ["Mexico", "Korea Republic", "Czechia", "South Africa"],
  "Group B": ["Canada", "Switzerland", "Bosnia and Herzegovina", "Qatar"],
  "Group C": ["Brazil", "Morocco", "Scotland", "Haiti"],
  "Group D": ["USA", "Türkiye", "Paraguay", "Australia"],
  "Group E": ["Germany", "Ecuador", "Côte d'Ivoire", "Curacao"],
  "Group F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
  "Group G": ["Belgium", "Egypt", "IR Iran", "New Zealand"],
  "Group H": ["Spain", "Uruguay", "Saudi Arabia", "Cabo Verde"],
  "Group I": ["France", "Senegal", "Norway", "Iraq"],
  "Group J": ["Argentina", "Austria", "Algeria", "Jordan"],
  "Group K": ["Portugal", "Colombia", "Congo DR", "Uzbekistan"],
  "Group L": ["England", "Croatia", "Ghana", "Panama"],
};

type Row = {
  team: string;
  played: number | null;
  gd: number | null;
  pts: number | null;
};

const formatUpdatedAt = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
};

const Groups = () => {
  const { toast } = useToast();
  const authed = isAuthenticated();

  // Handle Paystack callback (?reference=...) on return from hosted checkout.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference || !authed) return;
    (async () => {
      const result = await verifyPaystackPayment(reference);
      if (result.success) {
        toast({ title: 'Payment confirmed', description: 'Prediction unlocked!' });
      } else {
        toast({ title: 'Payment not verified', description: 'If you were charged, contact support.', variant: 'destructive' });
      }
      sessionStorage.removeItem('pending_unlock');
      // Clean URL and reload unlocks
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    })();
  }, [authed, toast]);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["group-standings"],
    queryFn: getGroupStandings,
    // Refresh every hour client-side; the backend cron is the source of truth.
    refetchInterval: 60 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
  });


  // Build a lookup of live standings keyed by group name.
  const liveByGroup = new Map<string, GroupStandingTeam[]>();
  if (data?.groups) {
    for (const g of data.groups) liveByGroup.set(g.group, g.teams);
  }

  const renderGroup = (groupName: string, staticTeams: string[]) => {
    const live = liveByGroup.get(groupName);
    let rows: Row[];

    if (live && live.length > 0) {
      // Sort by points, then GD, then GF as a tiebreak — fall back to API rank if provided.
      const sorted = [...live].sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank;
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });
      rows = sorted.map((t) => ({
        team: t.team,
        played: t.played,
        gd: t.goal_difference,
        pts: t.points,
      }));
    } else {
      rows = staticTeams.map((name) => ({ team: name, played: null, gd: null, pts: null }));
    }

    return (
      <Card
        key={groupName}
        className="overflow-hidden border-border bg-card shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-foreground" />
          <h2 className="font-display text-lg font-bold text-primary-foreground tracking-wide">
            {groupName}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-8 text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Team</TableHead>
              <TableHead className="text-center text-muted-foreground w-10">P</TableHead>
              <TableHead className="text-center text-muted-foreground w-10">GD</TableHead>
              <TableHead className="text-center text-accent font-bold w-12">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.team} className="border-border">
                <TableCell className="text-muted-foreground font-mono">{idx + 1}</TableCell>
                <TableCell className="font-medium">{row.team}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {row.played ?? "-"}
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {row.gd != null ? (row.gd > 0 ? `+${row.gd}` : row.gd) : "-"}
                </TableCell>
                <TableCell className="text-center font-bold text-accent">
                  {row.pts ?? "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <GroupPredictions groupName={groupName} />
      </Card>
    );
  };

  const statusBadge = (() => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" /> Loading standings…
        </Badge>
      );
    }
    if (isError || !data) {
      return (
        <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
          Showing draw rosters · live standings unavailable
        </Badge>
      );
    }
    if (!data.tournament_started) {
      return (
        <Badge variant="outline" className="border-secondary/60 text-secondary">
          Tournament starts June 11, 2026 · standings will populate matchday 1
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
        Live · updated {formatUpdatedAt(data.updated_at)}
      </Badge>
    );
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <Trophy className="h-8 w-8 text-accent" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">
              FIFA World Cup 2026 <span className="text-accent">Groups</span>
            </h1>
            <Trophy className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground mb-3">
            12 groups of 4 — Canada · Mexico · USA · June 11 – July 19, 2026
          </p>
          <div className="flex justify-center">{statusBadge}</div>
        </div>

        {!authed && (
          <div className="mb-6">
            <LoginPrompt title="Log in to see match predictions" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(STATIC_GROUPS).map(([name, teams]) => renderGroup(name, teams))}
        </div>


        <p className="text-center text-xs text-muted-foreground mt-8">
          Standings scraped daily from{" "}
          <a
            href={
              data?.source_url ??
              "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/groups"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:underline"
          >
            FIFA.com
          </a>{" "}
          and refreshed every 30 minutes on match days.
        </p>
      </main>
    </div>
  );
};

export default Groups;
