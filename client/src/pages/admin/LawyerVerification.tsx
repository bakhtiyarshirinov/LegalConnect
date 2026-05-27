import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ShieldCheck, MapPin, Briefcase, DollarSign } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import api from '../../api/axios'
import type { LawyerDetailDto } from '../../api/lawyers'

const stagger = { visible: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }

export default function LawyerVerification() {
  const qc = useQueryClient()

  const { data: lawyers = [], isLoading } = useQuery({
    queryKey: ['pending-lawyers'],
    queryFn: () =>
      api.get<LawyerDetailDto[]>('/api/admin/lawyers/pending').then((r) => r.data),
  })

  const { mutate: verify, variables: verifyingId } = useMutation({
    mutationFn: (id: string) =>
      api.put(`/api/admin/lawyers/${id}/verify`),
    onSuccess: () => {
      toast.success('Lawyer verified successfully!')
      qc.invalidateQueries({ queryKey: ['pending-lawyers'] })
      qc.invalidateQueries({ queryKey: ['all-lawyers'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 900, minHeight: 'calc(100vh - 64px)' }}
    >
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>
          Lawyer Verification
        </h1>
        <p style={{ color: '#6B6B6B', marginTop: 4 }}>
          {lawyers.length} pending {lawyers.length === 1 ? 'application' : 'applications'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : lawyers.length === 0 ? (
        <Card padding={48} style={{ textAlign: 'center' }}>
          <ShieldCheck size={40} color="#4ade80" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A', marginBottom: 8 }}>
            All caught up!
          </h3>
          <p style={{ color: '#6B6B6B', fontSize: 14 }}>No pending lawyer verifications</p>
        </Card>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lawyers.map((lawyer) => (
            <motion.div key={lawyer.id} variants={item}>
              <Card padding={24}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 56, height: 56, background: '#E8E8E8', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, fontWeight: 700, color: '#0A0A0A', flexShrink: 0,
                    }}
                  >
                    {lawyer.fullName[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A' }}>{lawyer.fullName}</h3>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, color: '#6B6B6B', fontSize: 13, marginBottom: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} /> {lawyer.city}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Briefcase size={13} /> {lawyer.experienceYears} years exp.
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DollarSign size={13} /> ${lawyer.hourlyRate}/hr
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 12 }}>
                      {lawyer.bio}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {lawyer.specializations.map((s) => (
                        <Badge key={s} variant="default">{s}</Badge>
                      ))}
                    </div>

                    <div
                      style={{
                        padding: '8px 12px', background: '#0A0A0A', borderRadius: 8,
                        border: '1px solid #E8E8E8', fontSize: 12, color: '#6B6B6B',
                        display: 'inline-block',
                      }}
                    >
                      License: <span style={{ color: '#0A0A0A', fontWeight: 500 }}>{lawyer.licenseNumber}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    onClick={() => verify(lawyer.id)}
                    loading={verifyingId === lawyer.id}
                    style={{ minWidth: 120 }}
                  >
                    <ShieldCheck size={14} /> Verify
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
