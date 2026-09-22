export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const csv = '\ufeff' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.style.display = 'none'
  // In the DOM, and revoked after the click has been dispatched: Safari and Firefox
  // ignore a click on a detached anchor or a URL revoked in the same tick.
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
}
