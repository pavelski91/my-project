import { useDeferredValue, useMemo, type ReactNode } from 'react'
import { useStore } from '../store'
import { computeMetrics, greenhouseSolar, type Metrics, type SolarResult } from '../lib/analysis'
import { useVeg } from '../scene/useVeg'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export function Section({ title, children, right, className }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={cx('border-b border-line px-4 py-3.5', className)}>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-2">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Row({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px] text-[12.5px]" title={hint}>
      <span className="text-ink-2">{label}</span>
      <span className="text-right font-medium tabular-nums text-ink">{children}</span>
    </div>
  )
}

export function Btn({
  children, active, onClick, className, title, disabled, tone,
}: { children: ReactNode; active?: boolean; onClick?: () => void; className?: string; title?: string; disabled?: boolean; tone?: 'sage' | 'plain' }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-40',
        active ? 'border-sage-d bg-sage-d text-white' : tone === 'sage' ? 'border-sage bg-sage/10 text-sage-d hover:bg-sage/20' : 'border-line bg-card text-ink hover:bg-paper-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-[5px] text-[12.5px]" title={hint}>
      <span className="text-ink">{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault()
          onChange(!checked)
        }}
        className={cx('relative h-[18px] w-[32px] shrink-0 rounded-full border transition-colors', checked ? 'border-sage-d bg-sage-d' : 'border-line bg-paper-2')}
      >
        <span className={cx('absolute top-[1px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all', checked ? 'left-[16px]' : 'left-[1px]')} />
      </span>
    </label>
  )
}

export function Slider({
  label, value, min, max, step = 0.1, onChange, unit = '', digits = 1, disabled,
}: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; digits?: number; disabled?: boolean }) {
  return (
    <div className="py-1.5">
      <div className="mb-0.5 flex justify-between text-[12px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-medium tabular-nums">{value.toFixed(digits)}{unit}</span>
      </div>
      <input type="range" disabled={disabled} min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="h-1 w-full cursor-pointer" />
    </div>
  )
}

export function NumberField({ label, value, onChange, step = 0.1, unit = 'm' }: { label: string; value: number; onChange: (v: number) => void; step?: number; unit?: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[12px]">
      <span className="text-ink-2">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          step={step}
          value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (Number.isFinite(v)) onChange(v)
          }}
          className="w-[72px] rounded-md border border-line bg-card px-1.5 py-1 text-right text-[12px] tabular-nums outline-none focus:border-sage"
        />
        <span className="w-4 text-ink-2">{unit}</span>
      </span>
    </label>
  )
}

export function Bar({ value, max, color = '#7c8f6b' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (value / max) * 100))}%`, background: color }} />
    </div>
  )
}

export function Modal({ title, onClose, children, wide, sub }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; sub?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-xl', wide ? 'max-w-[1180px]' : 'max-w-[720px]')}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            <h2 className="font-serif text-[20px] leading-tight text-ink">{title}</h2>
            {sub && <p className="mt-0.5 text-[12.5px] text-ink-2">{sub}</p>}
          </div>
          <button onClick={onClose} className="rounded-md border border-line bg-card px-2.5 py-1 text-[12px] hover:bg-paper-2" aria-label="Close">Close ✕</button>
        </header>
        <div className="overflow-auto">{children}</div>
      </div>
    </div>
  )
}

/** Metrics for the current (deferred) layout. */
export function useMetrics(): Metrics {
  const layout = useDeferredValue(useStore((s) => s.layout))
  const phase = useStore((s) => s.phase)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  const precip = useStore((s) => s.settings.precipMm)
  const veg = useVeg()
  return useMemo(() => computeMetrics(layout, phase, second, veg, precip), [layout, phase, second, veg, precip])
}

export function useSolar(): SolarResult[] | null {
  const layout = useDeferredValue(useStore((s) => s.layout))
  const phase = useStore((s) => s.phase)
  const second = useStore((s) => s.settings.releaseSecondDwelling)
  const years = useStore((s) => s.settings.growthYears)
  const veg = useVeg()
  return useMemo(() => {
    const g = 0.12 + 0.88 * (1 - Math.exp(-years / 11))
    return greenhouseSolar(layout, phase, second, veg, g)
  }, [layout, phase, second, veg, years])
}

export const fmt = (n: number, d = 0) => n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d })
