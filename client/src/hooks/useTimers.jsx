import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TimerContext = createContext(null);

let audioContext = null;

// Must be called from a tap so iOS lets the page play sound later.
const unlockAudio = () => {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  audioContext = audioContext || new AudioCtor();
  if (audioContext.state === "suspended") audioContext.resume();
};

const chime = () => {
  if (!audioContext) return;
  const start = audioContext.currentTime;
  [0, 0.35, 0.7].forEach((offset) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.3, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.3);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.32);
  });
  navigator.vibrate?.([300, 150, 300, 150, 300]);
};

export function TimerProvider({ children }) {
  const [timers, setTimers] = useState([]);
  const [now, setNow] = useState(Date.now());
  const nextId = useRef(1);

  const running = timers.some((timer) => !timer.done);

  useEffect(() => {
    if (!running) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    const finished = timers.filter((timer) => !timer.done && timer.endsAt <= now).map((timer) => timer.id);
    if (!finished.length) return;
    chime();
    setTimers((list) => list.map((timer) => (finished.includes(timer.id) ? { ...timer, done: true } : timer)));
  }, [now, timers]);

  const startTimer = useCallback((seconds, label, recipeTitle) => {
    unlockAudio();
    const id = nextId.current++;
    setNow(Date.now());
    setTimers((list) => [...list, { id, label, recipeTitle, endsAt: Date.now() + seconds * 1000, done: false }]);
  }, []);

  const removeTimer = useCallback((id) => {
    setTimers((list) => list.filter((timer) => timer.id !== id));
  }, []);

  return (
    <TimerContext.Provider value={{ timers, now, startTimer, removeTimer }}>{children}</TimerContext.Provider>
  );
}

export const useTimers = () => useContext(TimerContext);
