import { useState } from 'react';
import clutch from '@wc/assets/mascot-clutch.png';
import zayu from '@wc/assets/mascot-zayu.png';
import maple from '@wc/assets/mascot-maple.png';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MascotData {
  src: string;
  name: string;
  country: string;
  color: string;
  flag: string;
  quickFact: string;
  details: {
    animal: string;
    meaning: string;
    hostFact: string;
    matches: string;
  };
}

const MASCOTS: MascotData[] = [
  {
    src: zayu,
    name: 'Zayu',
    country: 'Mexico',
    color: 'mx-green',
    flag: '🇲🇽',
    quickFact: 'A spirited jaguar — Mexico\'s ancient Aztec symbol of strength!',
    details: {
      animal: 'Jaguar',
      meaning: 'Represents Mexico\'s rich indigenous heritage and the jaguar\'s role as a sacred creature in Aztec and Maya cultures.',
      hostFact: 'Mexico will host 10 matches across 3 cities: Mexico City, Guadalajara, and Monterrey.',
      matches: '10 group stage & knockout matches at Estadio Azteca and beyond.',
    },
  },
  {
    src: clutch,
    name: 'Clutch',
    country: 'USA',
    color: 'us-blue',
    flag: '🇺🇸',
    quickFact: 'A bold bald eagle — the national emblem of the United States!',
    details: {
      animal: 'Bald Eagle',
      meaning: 'Symbolizes freedom and determination. The bald eagle has been the national bird of the USA since 1782.',
      hostFact: 'The USA hosts the majority of matches across 11 cities, including the final at MetLife Stadium.',
      matches: '60+ matches including the opening game and the World Cup Final.',
    },
  },
  {
    src: maple,
    name: 'Maple',
    country: 'Canada',
    color: 'can-red',
    flag: '🇨🇦',
    quickFact: 'A friendly moose — Canada\'s iconic wilderness ambassador!',
    details: {
      animal: 'Moose',
      meaning: 'Embodies Canada\'s vast wilderness and welcoming spirit. The moose is one of Canada\'s most beloved national symbols.',
      hostFact: 'Canada hosts 10 matches in Vancouver and Toronto — its first ever men\'s World Cup.',
      matches: '10 matches, marking Canada\'s historic debut as a men\'s World Cup host.',
    },
  },
];

export const HeroSection = () => {
  const [selectedMascot, setSelectedMascot] = useState<MascotData | null>(null);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative overflow-hidden">
        {/* Tri-nation gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--us-blue))]/40 via-[hsl(var(--mx-green))]/20 to-[hsl(var(--can-red))]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_80%)]" />
          {/* Floating glow accents */}
          <div className="absolute top-10 left-[15%] w-24 h-24 bg-[hsl(var(--mx-green))]/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-[10%] w-32 h-32 bg-[hsl(var(--can-red))]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }} />
          <div className="absolute top-1/3 right-[30%] w-20 h-20 bg-[hsl(var(--secondary))]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          {/* Host nation flags */}
          <div className="flex justify-center gap-4 mb-6 text-4xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>⚽</span>
            <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🇲🇽</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🇺🇸</span>
            <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>🇨🇦</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🏆</span>
          </div>

          {/* Host flag bars */}
          <div className="flex justify-center gap-3 mb-8">
            <div className="w-14 h-9 rounded-sm shadow-lg opacity-90 bg-gradient-to-r from-[hsl(var(--mx-green))] via-white to-[hsl(var(--can-red))]" title="Mexico" />
            <div className="w-14 h-9 rounded-sm shadow-lg opacity-90 bg-gradient-to-r from-[hsl(var(--us-blue))] via-white to-[hsl(var(--can-red))]" title="USA" />
            <div className="w-14 h-9 rounded-sm shadow-lg opacity-90 bg-gradient-to-r from-[hsl(var(--can-red))] via-white to-[hsl(var(--can-red))]" title="Canada" />
          </div>

          {/* Main title */}
          <h1 className="font-display text-5xl md:text-7xl font-black mb-4 tracking-tighter leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">WORLD CUP </span>
            <span className="text-accent">2026</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">PREDICTOR</span>
          </h1>

          {/* Tagline */}
          <p className="font-display text-base md:text-lg text-foreground/40 mb-2 uppercase tracking-[0.3em] font-bold">
            United by the Game
          </p>
          <p className="font-display text-xs md:text-sm text-foreground/60 uppercase tracking-widest">
            Mexico • USA • Canada 2026
          </p>

          {/* Official Mascots */}
          <div className="mt-12">
            <p className="font-display text-xs md:text-sm text-foreground/50 uppercase tracking-[0.3em] mb-6">
              Official Mascots
            </p>
            <div className="flex justify-center items-end gap-6 md:gap-12 flex-wrap">
              {MASCOTS.map((m, i) => (
                <Tooltip key={m.name}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedMascot(m)}
                      className="group flex flex-col items-center animate-float cursor-pointer bg-transparent border-none p-0"
                      style={{ animationDelay: `${i * 0.4}s` }}
                    >
                      <div
                        className="relative w-28 h-28 md:w-40 md:h-40 rounded-full p-2 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `radial-gradient(circle at center, hsl(var(--${m.color}) / 0.35), transparent 70%)`,
                        }}
                      >
                        <img
                          src={m.src}
                          alt={`${m.name}, FIFA World Cup 2026 ${m.country} mascot`}
                          loading="lazy"
                          width={1024}
                          height={1024}
                          className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                        />
                      </div>
                      <h3
                        className="mt-3 font-display text-lg md:text-2xl font-black tracking-wider"
                        style={{ color: `hsl(var(--${m.color}))` }}
                      >
                        {m.name}
                      </h3>
                      <span className="font-display text-[10px] md:text-xs uppercase tracking-widest text-foreground/60">
                        {m.country}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-[220px] bg-background/95 backdrop-blur-sm border-border"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl shrink-0">{m.flag}</span>
                      <div>
                        <p className="font-display font-bold text-sm" style={{ color: `hsl(var(--${m.color}))` }}>
                          {m.name}
                        </p>
                        <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
                          {m.quickFact}
                        </p>
                        <p className="text-[10px] text-foreground/50 mt-1.5 uppercase tracking-wider">
                          Click for more
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Mascot Detail Dialog */}
        <Dialog open={!!selectedMascot} onOpenChange={(open) => !open && setSelectedMascot(null)}>
          <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border-border">
            {selectedMascot && (
              <>
                <DialogHeader className="text-center sm:text-center">
                  <div className="flex justify-center mb-3">
                    <div
                      className="w-24 h-24 rounded-full p-2"
                      style={{
                        background: `radial-gradient(circle at center, hsl(var(--${selectedMascot.color}) / 0.35), transparent 70%)`,
                      }}
                    >
                      <img
                        src={selectedMascot.src}
                        alt={selectedMascot.name}
                        className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  </div>
                  <DialogTitle
                    className="font-display text-2xl font-black tracking-wider"
                    style={{ color: `hsl(var(--${selectedMascot.color}))` }}
                  >
                    {selectedMascot.flag} {selectedMascot.name}
                  </DialogTitle>
                  <DialogDescription className="font-display text-xs uppercase tracking-widest text-foreground/60">
                    {selectedMascot.country} — FIFA World Cup 2026 Host Nation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground/50 mb-1">
                      Animal
                    </p>
                    <p className="text-sm text-foreground/90 font-medium">
                      {selectedMascot.details.animal}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground/50 mb-1">
                      Symbolism
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {selectedMascot.details.meaning}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground/50 mb-1">
                      Host Nation Fact
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {selectedMascot.details.hostFact}
                    </p>
                  </div>

                  <div
                    className="rounded-lg p-4"
                    style={{
                      background: `hsl(var(--${selectedMascot.color}) / 0.1)`,
                      border: `1px solid hsl(var(--${selectedMascot.color}) / 0.2)`,
                    }}
                  >
                    <p
                      className="font-display text-xs uppercase tracking-wider mb-1"
                      style={{ color: `hsl(var(--${selectedMascot.color}))` }}
                    >
                      Tournament Role
                    </p>
                    <p className="text-sm text-foreground/90 font-medium">
                      {selectedMascot.details.matches}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
