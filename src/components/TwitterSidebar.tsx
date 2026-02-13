import { useEffect, useRef, useState } from 'react';
import { Twitter, MessageCircle, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
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
      // If Twitter widgets script is already available, render
      if ((window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load(embedRef.current);
        return;
      }

      // Only load script once
      if (scriptLoaded.current) return;
      scriptLoaded.current = true;

      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.head.appendChild(script);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadTwitterWidget, 300);
    return () => clearTimeout(timer);
  }, [isOpen, twitterHandle]);

  return (
    <>
      {/* Toggle Button - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card/90 backdrop-blur-sm border border-border/50 border-r-0 rounded-l-lg p-2 hover:bg-card transition-colors shadow-lg"
        aria-label={isOpen ? 'Close Twitter feed' : 'Open Twitter feed'}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ChevronLeft className="h-4 w-4 text-foreground" />
            <Twitter className="h-4 w-4 text-[hsl(var(--secondary))]" />
          </div>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-14 bottom-0 z-30 w-80 bg-card/95 backdrop-blur-md border-l border-border/40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5 text-[hsl(var(--secondary))]" />
              <h2 className="font-display text-lg font-bold text-foreground">Fan Zone</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Latest tweets from the PSL community
            </p>
          </div>

          {/* Twitter Embed */}
          <div className="flex-1 overflow-y-auto p-3" ref={embedRef}>
            <a
              className="twitter-timeline"
              data-theme="dark"
              data-chrome="noheader nofooter noborders transparent"
              data-height="100%"
              href={`https://twitter.com/${twitterHandle}`}
            >
              Loading tweets...
            </a>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/40">
            <a
              href={`https://twitter.com/${twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-secondary/50 hover:bg-secondary/10"
              >
                <ExternalLink className="h-3 w-3" />
                Follow @{twitterHandle}
              </Button>
            </a>
            <div className="flex gap-2 mt-2">
              <a
                href={`https://twitter.com/intent/tweet?hashtags=PSL,SouthAfricanFootball`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs"
                >
                  <MessageCircle className="h-3 w-3" />
                  Tweet #PSL
                </Button>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
