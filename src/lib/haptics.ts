/** Best-effort haptic pulse. No-ops silently on browsers/devices without support (most desktops, iOS Safari). */
export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration API can throw in some embedded/webview contexts; ignore.
  }
}

export function hapticGood() {
  vibrate(30)
}

export function hapticBad() {
  vibrate([20, 40, 20])
}

export function hapticStreak() {
  vibrate([25, 30, 25, 30, 40])
}
