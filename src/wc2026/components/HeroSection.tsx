export const HeroSection = () => {
  return (
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
      </div>
    </div>
  );
};
