import { useRef, useCallback } from 'react';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export function useAudio(enabled: boolean) {
  const audioCtx = useRef<AudioContext | null>(null);
  const isAvailable = useRef(true);

  const initAudio = useCallback(() => {
    if (!isAvailable.current) return;
    if (!audioCtx.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
          isAvailable.current = false;
          return;
        }
        audioCtx.current = new Ctx();
      } catch (e) {
        isAvailable.current = false;
        return;
      }
    }
    if (audioCtx.current.state === 'suspended') {
      audioCtx.current.resume().catch(() => {
        isAvailable.current = false;
      });
    }
  }, []);

  const playTone = useCallback((value: number, min: number, max: number) => {
    if (!enabled || !isAvailable.current) return;
    initAudio();
    if (!audioCtx.current || audioCtx.current.state !== 'running') return;

    try {
      const range = max - min || 1;
      const freq = 200 + ((value - min) / range) * 600;
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);

      gain.gain.setValueAtTime(0.1, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.current.destination);

      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.1);
    } catch (e) {
      // fail safe
    }
  }, [enabled, initAudio]);

  return { playTone, isAvailable: isAvailable.current };
}
