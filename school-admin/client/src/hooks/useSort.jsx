import { useState, useMemo } from 'react'

/**
 * useSort — generic client-side sort hook
 * @param {Array}  data        — the array to sort
 * @param {string} defaultKey  — column key to sort by initially
 * @param {string} defaultDir  — 'asc' | 'desc'
 * @returns {{ sorted, sortKey, sortDir, handleSort }}
 */
export function useSort(data, defaultKey = '', defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !data?.length) return data ?? []
    return [...data].sort((a, b) => {
      const resolve = (obj, path) =>
        path.split('.').reduce((o, k) => (o == null ? '' : o[k]), obj)

      let av = resolve(a, sortKey)
      let bv = resolve(b, sortKey)

      if (av == null) return 1
      if (bv == null) return -1

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }

      if (typeof av === 'boolean' && typeof bv === 'boolean') {
        return sortDir === 'asc' ? (av === bv ? 0 : av ? -1 : 1) : (av === bv ? 0 : av ? 1 : -1)
      }

      if (av instanceof Date || (typeof av === 'string' && !isNaN(Date.parse(av)))) {
        const da = new Date(av).getTime()
        const db = new Date(bv).getTime()
        return sortDir === 'asc' ? da - db : db - da
      }

      av = String(av).toLowerCase()
      bv = String(bv).toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  return { sorted, sortKey, sortDir, handleSort }
}

/**
 * SortableHeader — a <th> that shows sort arrows and handles click
 */
export function SortableHeader({ col, label, sortKey, sortDir, onSort }) {
  const active = sortKey === col
  return (
    <th
      onClick={() => onSort(col)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {label}
        <span
          aria-hidden="true"
          style={{
            fontSize: '0.65rem',
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            opacity: active ? 1 : 0.4,
            transition: 'color 0.15s, opacity 0.15s',
            lineHeight: 1,
          }}
        >
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </span>
    </th>
  )
}
