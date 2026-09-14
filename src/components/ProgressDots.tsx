export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition ${
            i < current ? 'bg-emerald-400' : i === current ? 'bg-white' : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}
