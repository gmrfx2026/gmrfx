export const CHAT_BEEP_STORAGE_KEY = "gmrfx.chatBeepEnabled";

let lastBeepAt = 0;
const BEEP_DEBOUNCE_MS = 450;

/** Satu AudioContext untuk chat + alert komunitas agar unlock dari gestur pengguna berlaku sama. */
let sharedAudioContext: AudioContext | null = null;

let audioUnlockListenersAttached = false;

function getOrCreateSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AC();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/** Coba resume context (setelah klik / ketik — diperlukan banyak browser). */
export async function resumeSharedAudioContext(): Promise<boolean> {
  const ctx = getOrCreateSharedAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

/**
 * Pasang listener sekali: interaksi pertama di halaman membuka Web Audio
 * (tanpa ini, beep dari polling sering tidak bunyi walau preferensi beep aktif).
 */
export function attachAudioUnlockOnFirstUserGesture(): void {
  if (typeof window === "undefined" || audioUnlockListenersAttached) return;
  audioUnlockListenersAttached = true;

  let done = false;
  const unlock = () => {
    if (done) return;
    done = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    void resumeSharedAudioContext();
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

export function readChatBeepPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAT_BEEP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Satu bunyi pendek; debounce agar polling sidebar + thread tidak double. */
export function playChatIncomingBeep(): void {
  void playChatIncomingBeepAsync();
}

async function playChatIncomingBeepAsync(): Promise<void> {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastBeepAt < BEEP_DEBOUNCE_MS) return;
  lastBeepAt = now;

  try {
    const ctx = getOrCreateSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }
    if (ctx.state !== "running") return;

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
