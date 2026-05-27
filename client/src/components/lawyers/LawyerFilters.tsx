import { useQuery } from '@tanstack/react-query'
import { MapPin, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { specializationsApi } from '../../api/specializations'
import type { LawyersFilter } from '../../api/lawyers'

interface LawyerFiltersProps {
  filters: LawyersFilter
  onChange: (filters: LawyersFilter) => void
  onReset: () => void
}

export function LawyerFilters({ filters, onChange, onReset }: LawyerFiltersProps) {
  const { data: specializations = [] } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsApi.getAll,
    staleTime: Infinity,
  })

  const hasFilters = !!(filters.city || filters.specializationId || filters.maxRate)

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 16,
        padding: 20,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ flex: '1 1 180px' }}>
        <Input
          label="City"
          placeholder="e.g. Baku"
          value={filters.city ?? ''}
          onChange={(e) => onChange({ ...filters, city: e.target.value || undefined })}
          icon={<MapPin size={14} />}
        />
      </div>

      <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, color: '#0A0A0A', fontWeight: 500 }}>
          Specialization
        </label>
        <select
          value={filters.specializationId ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              specializationId: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: 10,
            padding: '11px 14px',
            color: filters.specializationId ? '#0A0A0A' : '#A3A3A3',
            fontSize: 14,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: '1 1 150px' }}>
        <Input
          label="Max rate ($/hr)"
          type="number"
          placeholder="e.g. 200"
          value={filters.maxRate ?? ''}
          onChange={(e) =>
            onChange({ ...filters, maxRate: e.target.value ? parseFloat(e.target.value) : undefined })
          }
          icon={<SlidersHorizontal size={14} />}
        />
      </div>

      {hasFilters && (
        <Button variant="secondary" size="md" onClick={onReset}>
          <X size={14} /> Reset
        </Button>
      )}
    </div>
  )
}
