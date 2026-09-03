import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Mail, Phone, Calendar, Clock, ShieldCheck, ShieldAlert,
  MapPin, Briefcase, DollarSign, Hash, Star, CheckCircle, XCircle,
} from 'lucide-react'
import { getUserProfile } from '../api/admin'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'

const roleBadge = (role: string) => {
  switch (role) {
    case 'Admin': return 'admin'
    case 'Lawyer': return 'lawyer'
    case 'Client': return 'client'
    default: return 'default'
  }
}

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const fmtDateTime = (v: string | null) =>
  v ? new Date(v).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const Row: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 py-2.5">
    <div className="w-8 h-8 rounded-lg bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-[#6B6B6B] flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs text-[#6B6B6B] uppercase tracking-wide">{label}</div>
      <div className="text-sm text-[#0A0A0A] font-medium break-words">{children}</div>
    </div>
  </div>
)

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = 'text-[#0A0A0A]' }) => (
  <div className="bg-[#F5F5F5] rounded-xl p-4">
    <div className={`text-2xl font-bold ${tone}`}>{value}</div>
    <div className="text-xs text-[#6B6B6B] mt-1">{label}</div>
  </div>
)

export const UserProfile: React.FC = () => {
  const { id = '' } = useParams()

  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => getUserProfile(id),
    retry: false,
  })

  const notFound = isError && (error as { response?: { status?: number } })?.response?.status === 404

  return (
    <div className="max-w-4xl">
      <Link to="/users" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> İstifadəçilərə qayıt
      </Link>

      {isLoading && <Skeleton count={3} className="h-40 w-full" />}

      {isError && (
        <Card>
          <div className="flex flex-col items-center text-center py-10">
            <div className="w-14 h-14 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mb-4">
              <XCircle className="w-7 h-7 text-[#6B6B6B]" />
            </div>
            <p className="text-lg font-semibold text-[#0A0A0A] mb-1">
              {notFound ? 'İstifadəçi tapılmadı' : 'Məlumat yüklənmədi'}
            </p>
            <p className="text-sm text-[#6B6B6B]">
              {notFound ? 'Bu id ilə istifadəçi mövcud deyil.' : 'Yenidən cəhd edin.'}
            </p>
          </div>
        </Card>
      )}

      {profile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
          {/* Header */}
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-xl font-bold text-[#0A0A0A] flex-shrink-0">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-[#0A0A0A] truncate">{profile.fullName}</h1>
                  <Badge variant={roleBadge(profile.role) as Parameters<typeof Badge>[0]['variant']}>{profile.role}</Badge>
                </div>
                <p className="text-sm text-[#6B6B6B] mt-0.5">{profile.email}</p>
              </div>
            </div>
          </Card>

          {/* Basic info */}
          <Card>
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wide mb-2">Əsas məlumat</h2>
            <div className="divide-y divide-[#F0F0F0]">
              <Row icon={<Mail className="w-4 h-4" />} label="E-poçt">{profile.email}</Row>
              <Row icon={<Phone className="w-4 h-4" />} label="Telefon">{profile.phone || '—'}</Row>
              <Row icon={<Calendar className="w-4 h-4" />} label="Qeydiyyat tarixi">{fmtDate(profile.createdAt)}</Row>
              <Row icon={<Clock className="w-4 h-4" />} label="Son aktivlik">{fmtDateTime(profile.lastSeen)}</Row>
              <Row icon={profile.isVerified ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} label="E-poçt təsdiqi">
                {profile.isVerified
                  ? <span className="text-emerald-600">Təsdiqlənib</span>
                  : <span className="text-[#6B6B6B]">Gözləyir</span>}
              </Row>
            </div>
          </Card>

          {/* Lawyer-specific */}
          {profile.lawyer && (
            <Card>
              <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wide mb-2">Vəkil məlumatları</h2>
              <div className="divide-y divide-[#F0F0F0]">
                <Row icon={profile.lawyer.isVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />} label="Vəkil təsdiqi">
                  {profile.lawyer.isVerified
                    ? <span className="text-emerald-600">Təsdiqlənib</span>
                    : <span className="text-[#E03131]">Təsdiqlənməyib</span>}
                  {' · '}
                  {profile.lawyer.isAvailable
                    ? <span className="text-[#6B6B6B]">Aktiv</span>
                    : <span className="text-[#6B6B6B]">Deaktiv</span>}
                </Row>
                <Row icon={<MapPin className="w-4 h-4" />} label="Şəhər">{profile.lawyer.city}</Row>
                <Row icon={<Hash className="w-4 h-4" />} label="Lisenziya nömrəsi">{profile.lawyer.licenseNumber}</Row>
                <Row icon={<Briefcase className="w-4 h-4" />} label="Təcrübə">{profile.lawyer.experienceYears} il</Row>
                <Row icon={<DollarSign className="w-4 h-4" />} label="Saatlıq qiymət">${profile.lawyer.hourlyRate}</Row>
                <Row icon={<Star className="w-4 h-4" />} label="Reytinq">
                  {profile.lawyer.rating.toFixed(1)} <span className="text-[#6B6B6B]">({profile.lawyer.reviewCount} rəy)</span>
                </Row>
                <Row icon={<Briefcase className="w-4 h-4" />} label="İxtisaslar">
                  {profile.lawyer.specializations.length > 0 ? (
                    <span className="flex flex-wrap gap-1.5 mt-1">
                      {profile.lawyer.specializations.map((s) => (
                        <span key={s} className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">{s}</span>
                      ))}
                    </span>
                  ) : '—'}
                </Row>
              </div>
            </Card>
          )}

          {/* Verification history — shown only if a verification was revoked (Phase 6.1) */}
          {profile.lawyer?.cancellationReason && (
            <Card>
              <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wide mb-3">Verifikasiya tarixçəsi</h2>
              <div className="flex items-start gap-3 p-3 bg-[#FFF1F0] border border-[#FFCCC7] rounded-xl">
                <ShieldAlert className="w-5 h-5 text-[#E03131] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#611A15]">Verifikasiya ləğv edilib</p>
                  <p className="text-sm text-[#611A15] mt-1">Səbəb: {profile.lawyer.cancellationReason}</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">{fmtDateTime(profile.lawyer.cancelledAt)}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <h2 className="text-sm font-bold text-[#0A0A0A] uppercase tracking-wide mb-3">
              Fəaliyyət — {profile.role === 'Lawyer' ? 'vəkil görüşləri' : 'müştəri görüşləri'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Stat label="Ümumi" value={profile.activity.totalAppointments} />
              <Stat label="Gözləyən" value={profile.activity.pendingAppointments} tone="text-amber-600" />
              <Stat label="Təsdiqlənmiş" value={profile.activity.confirmedAppointments} tone="text-emerald-600" />
              <Stat label="Tamamlanmış" value={profile.activity.completedAppointments} tone="text-sky-600" />
              <Stat label="Ləğv edilmiş" value={profile.activity.cancelledAppointments} tone="text-[#E03131]" />
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
