import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Briefcase, CheckCircle, ArrowRight, MapPin, Star } from 'lucide-react'
import { getPendingLawyers, verifyLawyer, getAdminStats } from '../api/admin'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LawyerCardSkeleton } from '../components/ui/Skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' as const },
  }),
}

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending-lawyers'],
    queryFn: getPendingLawyers,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: verifyLawyer,
    onSuccess: (_, id) => {
      toast.success('Vəkil uğurla təsdiqləndi!')
      queryClient.setQueryData<typeof pending>(['pending-lawyers'], (old = []) =>
        old.filter((l) => l.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Təsdiqləmə alınmadı. Yenidən cəhd edin.'),
  })

  const statCards = [
    { label: 'Gözləyən Təsdiqlər', value: statsLoading || !stats ? '—' : stats.pendingApprovals },
    { label: 'Ümumi İstifadəçilər', value: statsLoading || !stats ? '—' : stats.totalUsers },
    { label: 'Təsdiqlənmiş Vəkillər', value: statsLoading || !stats ? '—' : stats.verifiedLawyers },
  ]

  const preview = pending.slice(0, 5)

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Admin Paneli</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Platforma fəaliyyətinə ümumi baxış</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            style={{ background: '#FFFFFF', border: '1px solid #F0F0F0', borderTop: '3px solid #0A0A0A', borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'default' }}
          >
            <div style={{ fontSize: 40, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0A0A0A]">Təsdiq gözləyir</h2>
          <p className="text-sm text-[#6B6B6B]">Təsdiq gözləyən vəkillər</p>
        </div>
        <Link to="/lawyers">
          <Button variant="secondary" size="sm">
            Hamısına bax
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <LawyerCardSkeleton key={i} />)}
        </div>
      ) : preview.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-lg font-semibold text-[#0A0A0A]">Bütün vəkillər təsdiqləndi</p>
          <p className="text-sm text-[#6B6B6B] mt-1">Gözləyən təsdiq yoxdur</p>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {preview.map((lawyer, i) => (
            <motion.div key={lawyer.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-[#0A0A0A]">{lawyer.fullName}</h3>
                      <Badge variant="pending">Gözləyir</Badge>
                    </div>
                    <p className="text-sm text-[#6B6B6B] mb-3">{lawyer.email}</p>
                    <div className="flex items-center gap-4 text-xs text-[#6B6B6B]">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lawyer.city}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {lawyer.experienceYears} il təcrübə</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> ${lawyer.hourlyRate}/saat</span>
                    </div>
                  </div>
                  <Button variant="success" size="sm" loading={verifying} onClick={() => verify(lawyer.id)}>
                    Təsdiqlə
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
