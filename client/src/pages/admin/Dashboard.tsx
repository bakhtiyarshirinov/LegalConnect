import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Users, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import api from '../../api/axios'
import type { LawyerDto } from '../../api/lawyers'

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)!
  const navigate = useNavigate()

  const { data: pendingLawyers = [] } = useQuery({
    queryKey: ['pending-lawyers'],
    queryFn: () => api.get<LawyerDto[]>('/admin/lawyers/pending').then((r) => r.data),
  })

  const { data: allLawyers = [] } = useQuery({
    queryKey: ['all-lawyers'],
    queryFn: () => api.get<LawyerDto[]>('/lawyers').then((r) => r.data),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '32px 28px', maxWidth: 900, minHeight: 'calc(100vh - 64px)' }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.5px' }}>
          Admin Paneli
        </h1>
        <p style={{ color: '#6B6B6B', marginTop: 4 }}>Xoş gəldiniz, {user.fullName}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Ümumi vəkillər', value: allLawyers.length, icon: <Users size={20} /> },
          { label: 'Təsdiqlənmiş vəkillər', value: allLawyers.filter((l) => l.isVerified).length, icon: <ShieldCheck size={20} /> },
          { label: 'Təsdiq gözləyir', value: pendingLawyers.length, icon: <ShieldCheck size={20} /> },
        ].map((stat) => (
          <Card key={stat.label} padding={20}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ color: '#6B6B6B' }}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#6B6B6B' }}>{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pending Lawyers Quick View */}
      <Card padding={24}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A' }}>
            Gözləyən Təsdiqlər{' '}
            {pendingLawyers.length > 0 && (
              <span
                style={{
                  background: '#fff',
                  color: '#000',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 8px',
                  marginLeft: 8,
                }}
              >
                {pendingLawyers.length}
              </span>
            )}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/lawyers')}>
            Hamısını gör <ArrowRight size={13} />
          </Button>
        </div>
        {pendingLawyers.length === 0 ? (
          <p style={{ color: '#6B6B6B', fontSize: 14, textAlign: 'center', padding: '16px 0' }}>
            ✓ Gözləyən təsdiq yoxdur
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingLawyers.slice(0, 5).map((lawyer) => (
              <div
                key={lawyer.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#F5F5F5',
                  borderRadius: 8,
                  border: '1px solid #E8E8E8',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36, height: 36, background: '#E8E8E8', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#0A0A0A',
                    }}
                  >
                    {lawyer.fullName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0A0A0A' }}>{lawyer.fullName}</div>
                    <div style={{ fontSize: 12, color: '#6B6B6B' }}>{lawyer.city} · ${lawyer.hourlyRate}/saat</div>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('/admin/lawyers')}>
                  İcmalə bax
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}
