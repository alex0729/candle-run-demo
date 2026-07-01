export const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR')
export const fmtPx = (n: number) => Math.round(n).toLocaleString('ko-KR')
export const pct = (x: number, d = 1) => (x >= 0 ? '+' : '') + (x * 100).toFixed(d) + '%'
export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')
