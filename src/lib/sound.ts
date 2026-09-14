const STORAGE_KEY = 'macroguess:sound'

export function isSoundEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  return localStorage.getItem(STORAGE_KEY) !== '0'
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
}

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

/** Call from a click handler so the AudioContext resumes within a real user gesture. */
export function primeAudio() {
  const c = getContext()
  if (c && c.state === 'suspended') c.resume()
}

function playTone(freq: number, startOffset: number, duration: number, type: OscillatorType, gainPeak: number) {
  const c = getContext()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t0 = c.currentTime + startOffset
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Subtle two-note ascending chime for a good round. */
function playGoodChime() {
  playTone(659.25, 0, 0.16, 'sine', 0.09) // E5
  playTone(987.77, 0.09, 0.22, 'sine', 0.09) // B5
}

/** Subtle, soft descending tone for a bad round — not a harsh buzzer. */
function playBadTone() {
  playTone(293.66, 0, 0.22, 'triangle', 0.06) // D4
  playTone(233.08, 0.1, 0.26, 'triangle', 0.05) // Bb3
}

/** Plays a subtle good/bad sound based on the round score (0-100 scale). No-ops if sound is muted. */
export function playRoundResultSound(roundTotal: number) {
  if (!isSoundEnabled()) return
  if (roundTotal >= 65) playGoodChime()
  else playBadTone()
}
