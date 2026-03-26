import type { MutableRefObject } from "react";

export const CHAT_BEEP_STORAGE_KEY = "gmrfx.chatBeepEnabled";

let lastBeepAt = 0;
const BEEP_DEBOUNCE_MS = 450;

export function readChatBeepPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAT_BEEP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Satu bunyi pendek; debounce agar polling sidebar + thread tidak double. */
export function playChatIncomingBeep(audioCtxRef: MutableRefObject<AudioContext | null>) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastBeepAt < BEEP_DEBOUNCE_MS) return;
  lastBeepAt = now;

  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    let ctx = audioCtxRef.current;
    if (!ctx || ctx.state === "closed") {
      ctx = new AC();
      audioCtxRef.current = ctx;
    }
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    /* autoplay / API tidak tersedia */
  }
}
