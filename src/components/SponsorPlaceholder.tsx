interface SponsorPlaceholderProps {
  side: 'left' | 'right';
}

export const SponsorPlaceholder = ({ side }: SponsorPlaceholderProps) => {
  return (
    <div className="hidden lg:flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[160px] h-[600px] first:h-[250px] last:h-[250px] border-2 border-dashed border-primary/20 rounded-xl bg-card/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-muted-foreground/50"
        >
          <span className="text-xs font-display uppercase tracking-wider">Sponsor</span>
          <span className="text-[10px]">Ad Space</span>
        </div>
      ))}
    </div>
  );
};
