export const SponsorBanner = () => {
  return (
    <div className="w-full max-w-4xl mx-auto py-6 relative z-10">
      <div className="border-2 border-dashed border-primary/20 rounded-xl bg-card/30 backdrop-blur-sm flex items-center justify-center gap-2 text-muted-foreground/50 h-[360px]">
        <span className="text-xs font-display uppercase tracking-wider">Sponsor Banner</span>
        <span className="text-[10px]">728 × 90</span>
      </div>
    </div>
  );
};
