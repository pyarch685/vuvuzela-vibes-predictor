import { useEffect, useRef, useState } from 'react';
import { Twitter, MessageCircle, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTwitterFeed, TwitterTweet } from '@/lib/api';

interface TwitterSidebarProps {
  twitterHandle?: string;
}

type FeedMode = 'loading' | 'tweets' | 'embed' | 'fallback';

const EMBED_TIMEOUT_MS = 8000;

function formatTweetDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

export const TwitterSidebar = ({ twitterHandle = 'OfficialPSL' }: TwitterSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [tweets, setTweets] = useState<TwitterTweet[]>([]);
  const [mode, setMode] = useState<FeedMode>('loading');
  const embedRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  const profileUrl = `https://x.com/${twitterHandle}`;
  const tweetIntentUrl = `https://x.com/intent/tweet?hashtags=PSL,SouthAfricanFootball`;

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const load = async () => {
      setMode('loading');
      try {
        const res = await getTwitterFeed(twitterHandle);
        if (cancelled) return;
        if (res.tweets?.length) {
          setTweets(res.tweets);
          setMode('tweets');
        } else {
          setMode('embed');
        }
      } catch {
        if (!cancelled) setMode('embed');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, twitterHandle]);

  useEffect(() => {
    if (!isOpen || mode !== 'embed') return;

    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const loadTwitterWidget = () => {
      const container = embedRef.current;
      if (!container) return;

      const twttr = (window as unknown as {
        twttr?: { widgets?: { load: (el?: HTMLElement | null) => void } };
      }).twttr;

      if (twttr?.widgets) {
        twttr.widgets.load(container);
      } else if (!scriptLoaded.current) {
        scriptLoaded.current = true;
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        document.head.appendChild(script);
      }

      fallbackTimer = setTimeout(() => {
        if (!embedRef.current) return;
        const hasIframe = embedRef.current.querySelector('iframe');
        if (!hasIframe) setMode('fallback');
      }, EMBED_TIMEOUT_MS);
    };

    const startTimer = setTimeout(loadTwitterWidget, 100);
    return () => {
      clearTimeout(startTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [isOpen, mode, twitterHandle]);

  return (
    <section className="w-full max-w-4xl mx-auto py-8 relative z-10">
      {/* Header with toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-card/80 backdrop-blur-sm border-2 border-secondary/30 rounded-t-xl p-4 hover:bg-card/90 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-[hsl(var(--secondary))]" />
          <h2 className="font-display text-xl font-bold text-foreground">Fan Zone</h2>
          <span className="text-xs text-muted-foreground ml-2">Latest from the PSL community</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="bg-card/60 backdrop-blur-sm border-2 border-t-0 border-secondary/30 rounded-b-xl overflow-hidden">
          <div className="p-4 max-h-[500px] overflow-y-auto" ref={embedRef}>
            {mode === 'loading' && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              </div>
            )}

            {mode === 'embed' && (
              <a
                className="twitter-timeline"
                data-theme="dark"
                data-chrome="noborders transparent"
                data-height="450"
                href={profileUrl}
              >
                Loading tweets from @{twitterHandle}…
              </a>
            )}

            {mode === 'fallback' && (
              <div className="text-center py-10 space-y-4">
                <Twitter className="h-10 w-10 text-secondary mx-auto" />
                <div className="space-y-1">
                  <p className="text-foreground font-medium">
                    The live feed couldn't load in the browser.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    View the latest posts from @{twitterHandle} directly on X.
                  </p>
                </div>
                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open @{twitterHandle} on X
                  </Button>
                </a>
              </div>
            )}

            {mode === 'tweets' && (
              <ul className="space-y-4">
                {tweets.map((t) => (
                  <li key={t.id} className="border-b border-border/40 pb-4 last:border-0 last:pb-0">
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:opacity-90 transition-opacity"
                    >
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{t.text}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatTweetDate(t.created_at)}</span>
                        {t.metrics?.like_count != null && (
                          <span>❤ {t.metrics.like_count}</span>
                        )}
                        {t.metrics?.retweet_count != null && (
                          <span>↻ {t.metrics.retweet_count}</span>
                        )}
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-border/40 flex flex-wrap gap-2 items-center justify-between">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-secondary/50 hover:bg-secondary/10"
              >
                <ExternalLink className="h-3 w-3" />
                Follow @{twitterHandle}
              </Button>
            </a>
            <a
              href={tweetIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
              >
                <MessageCircle className="h-3 w-3" />
                Tweet #PSL
              </Button>
            </a>
          </div>
        </div>
      )}
    </section>
  );
};
