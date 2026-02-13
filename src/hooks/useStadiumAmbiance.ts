import { useEffect, useRef, useCallback } from 'react';
import { getStadiumAudioUrl } from '@/lib/api';

export const useStadiumAmbiance = (enabled: boolean) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const startSynthesized = useCallback(() => {
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Crowd noise
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = noiseBuffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const crowdFilter = ctx.createBiquadFilter();
    crowdFilter.type = 'bandpass';
    crowdFilter.frequency.value = 600;
    crowdFilter.Q.value = 0.5;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 2000;

    const crowdGain = ctx.createGain();
    crowdGain.gain.value = 0.6;

    noiseSource.connect(crowdFilter);
    crowdFilter.connect(warmth);
    warmth.connect(crowdGain);
    crowdGain.connect(masterGain);
    noiseSource.start();

    // Chant layer
    const chantNoise = ctx.createBufferSource();
    chantNoise.buffer = noiseBuffer;
    chantNoise.loop = true;

    const chantFilter = ctx.createBiquadFilter();
    chantFilter.type = 'bandpass';
    chantFilter.frequency.value = 400;
    chantFilter.Q.value = 1.5;

    const chantGain = ctx.createGain();
    chantGain.gain.value = 0.3;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(chantGain.gain);
    lfo.start();

    chantNoise.connect(chantFilter);
    chantFilter.connect(chantGain);
    chantGain.connect(masterGain);
    chantNoise.start();

    // Vuvuzela drone
    const vuvuzelaGain = ctx.createGain();
    vuvuzelaGain.gain.value = 0.25;
    vuvuzelaGain.connect(masterGain);

    [233, 466, 699].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq + (Math.random() * 4 - 2);

      const oscGain = ctx.createGain();
      oscGain.gain.value = [0.5, 0.3, 0.15][i];

      const wobble = ctx.createOscillator();
      wobble.frequency.value = 3 + Math.random() * 2;
      const wobbleGain = ctx.createGain();
      wobbleGain.gain.value = 2;
      wobble.connect(wobbleGain);
      wobbleGain.connect(osc.frequency);
      wobble.start();

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = 5;

      osc.connect(bp);
      bp.connect(oscGain);
      oscGain.connect(vuvuzelaGain);
      osc.start();
    });

    // Second detuned vuvuzela
    const vuv2Gain = ctx.createGain();
    vuv2Gain.gain.value = 0.15;
    vuv2Gain.connect(masterGain);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 237;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 237;
    f2.Q.value = 6;
    osc2.connect(f2);
    f2.connect(vuv2Gain);
    osc2.start();

    masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
    console.log('Stadium ambiance: synthesized fallback started');
  }, []);

  const startAudio = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    // Try fetching admin-uploaded audio from backend
    try {
      const audioUrl = await getStadiumAudioUrl();
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.loop = true;
        audio.volume = 0.3;
        audioRef.current = audio;
        await audio.play();
        console.log('Stadium ambiance: playing admin-uploaded audio');
        return;
      }
    } catch (err) {
      console.log('No custom audio from backend, using synthesized fallback');
    }

    // Fallback to synthesized sound
    startSynthesized();
  }, [startSynthesized]);

  useEffect(() => {
    if (enabled && !isPlayingRef.current) {
      startAudio();
    } else if (!enabled && isPlayingRef.current) {
      stopAll();
    }

    return () => {
      stopAll();
    };
  }, [enabled, startAudio, stopAll]);
};
