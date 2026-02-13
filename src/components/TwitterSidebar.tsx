import { useEffect, useRef, useState } from 'react';
import { Twitter, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TwitterSidebarProps {
  twitterHandle?: string;
}

export const TwitterSidebar = ({ twitterHandle = 'OfficialPSL' }: TwitterSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const embedRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTwitterWidget = () => {
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(embedRef.current);
        return;
      }

      if (scriptLoaded.current) return;
      scriptLoaded.current = true;

      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    };

    const timer = setTimeout(loadTwitterWidget, 300);
    return () => clearTimeout(timer);
  }, [isOpen, twitterHandle]);

  return (
    <section className="container mx-auto px-4 py-8 relative z-10">
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
          {/* Twitter Embed */}
          <div className="p-4 max-h-[500px] overflow-y-auto" ref={embedRef}>
            <a
              className="twitter-timeline"
              data-theme="dark"
              data-chrome="noheader nofooter noborders transparent"
              data-height="450"
              href={`https://twitter.com/${twitterHandle}`}
            >
              Loading tweets...
            </a>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-border/40 flex flex-wrap gap-2 items-center justify-between">
            <a
              href={`https://twitter.com/${twitterHandle}`}
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
              href={`https://twitter.com/intent/tweet?hashtags=PSL,SouthAfricanFootball`}
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
