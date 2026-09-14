import { useState } from 'react'
import { isSoundEnabled, setSoundEnabled } from '../lib/sound'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(() => isSoundEnabled())

  return (
    <button
      onClick={() => {
        const next = !enabled
        setEnabled(next)
        setSoundEnabled(next)
      }}
      aria-label={enabled ? 'Mute sound' : 'Unmute sound'}
      className="fixed right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-sm text-gray-300 backdrop-blur-sm transition hover:bg-black/60"
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}
