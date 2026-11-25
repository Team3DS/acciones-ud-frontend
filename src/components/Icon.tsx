import { useId } from 'react'

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    play: <path d="m8 5 11 7-11 7Z"/>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    candles: <><path d="M6 2v5m0 8v7m6-18v8m0 6v4m6-20v3m0 10v7"/><rect x="3.5" y="7" width="5" height="8" rx="1"/><rect x="9.5" y="12" width="5" height="6" rx="1"/><rect x="15.5" y="5" width="5" height="10" rx="1"/></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
    monitor: <><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    wallet: <><path d="M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M20 11h-6v6h6m-3-3h.01"/></>,
    chart: <><path d="M3 3v18h18M6 15l5-5 4 3 6-8"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>,
    orders: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/></>,
    shield: <><path d="m12 3 8 3v5c0 5-8 10-8 10S4 16 4 11V6Z"/><path d="m8 11 3 3 5-5"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 6 9 7 9-7"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1.5 1-1.5 1-1.5 3m0 3h.01"/></>,
    exit: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-6-4h13"/></>,
    bell: <><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4"/></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>
}
export function Brand() { return <a className="brand" href="#" onClick={e => e.preventDefault()} aria-label="Acciones UD"><BrandMark/><span>Acciones <b>UD</b></span></a> }


export function BrandMark() {
  const id = useId()
  return <svg className="brand-mark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-ring`} x1="15" y1="15" x2="105" y2="112" gradientUnits="userSpaceOnUse"><stop stopColor="var(--brand-highlight)"/><stop offset=".38" stopColor="var(--accent)"/><stop offset=".72" stopColor="var(--accent-bright)"/><stop offset="1" stopColor="var(--brand-deep)"/></linearGradient>
      <linearGradient id={`${id}-bars`} x1="76" y1="23" x2="90" y2="99" gradientUnits="userSpaceOnUse"><stop stopColor="var(--brand-highlight)"/><stop offset=".45" stopColor="var(--accent)"/><stop offset="1" stopColor="var(--accent-bright)"/></linearGradient>
      <linearGradient id={`${id}-soft`} x1="41" y1="67" x2="57" y2="112" gradientUnits="userSpaceOnUse"><stop stopColor="var(--brand-soft)"/><stop offset="1" stopColor="var(--brand-soft-end)"/></linearGradient>
    </defs>
    <path d="M103 21A53 53 0 1 0 106 96" stroke={`url(#${id}-ring)`} strokeWidth="5"/>
    <rect x="35" y="67" width="20" height="40" rx="2.5" fill={`url(#${id}-soft)`}/>
    <rect x="64" y="49" width="20" height="47" rx="2.5" fill={`url(#${id}-bars)`}/>
    <rect x="93" y="30" width="20" height="50" rx="2.5" fill={`url(#${id}-bars)`}/>
    <path d="M103 21v9" stroke="var(--brand-highlight)" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
}
