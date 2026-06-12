import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { specializationsApi } from '../../api/specializations'
import type { LawyersFilter } from '../../api/lawyers'

interface LawyerFiltersProps {
  filters: LawyersFilter
  onChange: (filters: LawyersFilter) => void
  onReset: () => void
}

const SORT_OPTIONS = [
  { value: 'rating',     label: 'Ən yüksək reytinqli' },
  { value: 'price_asc',  label: 'Qiymət: Aşağıdan yuxarıya' },
  { value: 'price_desc', label: 'Qiymət: Yuxarıdan aşağıya' },
  { value: 'experience', label: 'Ən təcrübəli' },
] as const

const EXP_OPTIONS = [
  { value: '', label: 'Hamısı' },
  { value: '1',  label: '1+ il' },
  { value: '3',  label: '3+ il' },
  { value: '5',  label: '5+ il' },
  { value: '10', label: '10+ il' },
]

const RATING_OPTIONS = [
  { value: '',    label: 'Hamısı' },
  { value: '3',   label: '3+ ulduz' },
  { value: '4',   label: '4+ ulduz' },
  { value: '4.5', label: '4.5+ ulduz' },
]

const selStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'var(--text)',
  fontSize: 14,
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  width: '100%',
} as React.CSSProperties

export function LawyerFilters({ filters, onChange, onReset }: LawyerFiltersProps) {
  const [expanded, setExpanded] = useState(false)

  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsApi.getAll,
    staleTime: Infinity,
  })

  const hasAnyFilter = !!(
    filters.city || filters.specializationId || filters.maxRate || filters.sortBy ||
    filters.minRate || filters.minExperience || filters.minRating
  )

  const chips: { label: string; clear: () => void }[] = []
  if (filters.city) chips.push({ label: `Şəhər: ${filters.city}`, clear: () => onChange({ ...filters, city: undefined }) })
  if (filters.specializationId) {
    const spec = specializations.find((s) => s.id === filters.specializationId)
    if (spec) chips.push({ label: spec.name, clear: () => onChange({ ...filters, specializationId: undefined }) })
  }
  if (filters.maxRate) chips.push({ label: `Maks. $${filters.maxRate}/saat`, clear: () => onChange({ ...filters, maxRate: undefined }) })
  if (filters.minRate) chips.push({ label: `Min. $${filters.minRate}/saat`, clear: () => onChange({ ...filters, minRate: undefined }) })
  if (filters.minExperience) chips.push({ label: `${filters.minExperience}+ il`, clear: () => onChange({ ...filters, minExperience: undefined }) })
  if (filters.minRating) chips.push({ label: `${filters.minRating}+ ulduz`, clear: () => onChange({ ...filters, minRating: undefined }) })
  if (filters.sortBy) {
    const s = SORT_OPTIONS.find((o) => o.value === filters.sortBy)
    if (s) chips.push({ label: `Sort: ${s.label}`, clear: () => onChange({ ...filters, sortBy: undefined }) })
  }

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 160px' }}>
          <Input
            label="Şəhər"
            placeholder="məs. Bakı"
            value={filters.city ?? ''}
            onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
            icon={<MapPin size={14} />}
          />
        </div>

        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>İxtisas</label>
          <select value={filters.specializationId ?? ''} onChange={(e) => onChange({ ...filters, specializationId: e.target.value ? parseInt(e.target.value) : undefined })} style={selStyle}>
            <option value="">Bütün ixtisaslar</option>
            {specializations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={{ flex: '1 1 130px' }}>
          <Input
            label="Maks. qiymət ($/saat)"
            type="number"
            placeholder="məs. 200"
            value={filters.maxRate ?? ''}
            onChange={(e) => onChange({ ...filters, maxRate: e.target.value ? parseFloat(e.target.value) : undefined })}
            icon={<SlidersHorizontal size={14} />}
          />
        </div>

        <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Sırala</label>
          <select value={filters.sortBy ?? 'rating'} onChange={(e) => onChange({ ...filters, sortBy: (e.target.value as LawyersFilter['sortBy']) || undefined })} style={selStyle}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: expanded ? 'var(--accent)' : 'var(--surface)', color: expanded ? 'var(--accent-text)' : 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}
          >
            Daha çox {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {hasAnyFilter && <Button variant="secondary" size="md" onClick={onReset}><X size={14} /> Sıfırla</Button>}
        </div>
      </div>

      {expanded && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: '1 1 130px' }}>
            <Input label="Min. qiymət ($/saat)" type="number" placeholder="məs. 50" value={filters.minRate ?? ''} onChange={(e) => onChange({ ...filters, minRate: e.target.value ? parseFloat(e.target.value) : undefined })} />
          </div>
          <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Min. təcrübə</label>
            <select value={filters.minExperience ?? ''} onChange={(e) => onChange({ ...filters, minExperience: e.target.value ? parseInt(e.target.value) : undefined })} style={selStyle}>
              {EXP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Min. reytinq</label>
            <select value={filters.minRating ?? ''} onChange={(e) => onChange({ ...filters, minRating: e.target.value ? parseFloat(e.target.value) : undefined })} style={selStyle}>
              {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {chips.map(({ label, clear }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {label}
              <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-2)' }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
