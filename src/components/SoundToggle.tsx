import { useState, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useStadiumAmbiance } from '@/hooks/useStadiumAmbiance';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: true,
  toggleSound: () => {},
});

export const useSoundContext = () => useContext(SoundContext);

export const SoundProvider = ({ children }: { children: React.ReactNode }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  useStadiumAmbiance(soundEnabled);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const SoundToggle = () => {
  const { soundEnabled, toggleSound } = useSoundContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSound}
      className="h-9 w-9"
    >
      {soundEnabled ? (
        <Volume2 className="h-4 w-4 text-secondary" />
      ) : (
        <VolumeX className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
};
