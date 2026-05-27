import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { lawyersApi, type LawyersFilter } from '../../api/lawyers'
import { LawyerCard } from '../../components/lawyers/LawyerCard'
import { LawyerFilters } from '../../components/lawyers/LawyerFilters'
import { SkeletonCard } from '../../components/ui/Skeleton'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const pageVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export default function Lawyers() {
  const [filters, setFilters] = useState<LawyersFilter>({})

  const { data: lawyers = [], isLoading } = useQuery({
    queryKey: ['lawyers', filters],
    queryFn: () => lawyersApi.getAll(filters),
  })

  return (
    <motion.div
      initial="hidden" animate="visible" variants={pageVariant}
      style={{ padding: '32px 36px', background: '#F5F5F5', minHeight: 'calc(100vh - 64px)' }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Find a Lawyer
        </h1>
        <p style={{ color: '#6B6B6B', fontSize: 15 }}>Browse verified legal professionals in Azerbaijan</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <LawyerFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({})}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : lawyers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center', padding: '64px 24px',
            background: '#FFFFFF', border: '1px solid #E8E8E8',
            borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Search size={40} color="#A3A3A3" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>No lawyers found</h3>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>Try adjusting your filters to find more results.</p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}
        >
          {lawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} lawyer={lawyer} />
          ))}
        </motion.div>
      )}

      {!isLoading && lawyers.length > 0 && (
        <p style={{ textAlign: 'center', color: '#A3A3A3', fontSize: 13, marginTop: 24 }}>
          {lawyers.length} lawyer{lawyers.length !== 1 ? 's' : ''} found
        </p>
      )}
    </motion.div>
  )
}
