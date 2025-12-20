import saFansHero from '@/assets/sa-fans-hero.png';
import taxiFans from '@/assets/taxi-fans.png';

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={saFansHero} 
          alt="South African soccer fans celebrating" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 text-center">
        {/* Animated emojis */}
        <div className="flex justify-center gap-4 mb-4 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0s' }}>⚽</span>
          <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>🇿🇦</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>📣</span>
          <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>🏆</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>⚽</span>
        </div>

        {/* Main title */}
        <h1 className="font-display text-5xl md:text-7xl text-foreground mb-2 tracking-tight">
          <span className="text-primary">PSL</span>{' '}
          <span className="text-secondary">Match</span>{' '}
          <span className="text-accent">Predictor</span>
        </h1>

        {/* Subtitle with SA flair */}
        <p className="font-display text-xl md:text-2xl text-muted-foreground mb-6 uppercase tracking-wider">
          Yebo! AI-Powered Predictions from Soweto to Cape Town
        </p>

        {/* Mascot image */}
        <div className="relative mx-auto max-w-md">
          <img 
            src={taxiFans}
            alt="Taxi fans celebrating"
            className="w-64 h-64 mx-auto object-contain animate-float drop-shadow-2xl"
          />
        </div>

        {/* Team colors banner */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-chiefs-gold/50">
            <div className="w-4 h-4 rounded-full bg-chiefs-gold" />
            <span className="text-sm font-medium">Chiefs</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-pirates-white/50">
            <div className="w-4 h-4 rounded-full bg-pirates-white border border-pirates-black" />
            <span className="text-sm font-medium">Pirates</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-sundowns-yellow/50">
            <div className="w-4 h-4 rounded-full bg-sundowns-yellow" />
            <span className="text-sm font-medium">Sundowns</span>
          </div>
        </div>
      </div>
    </div>
  );
};
