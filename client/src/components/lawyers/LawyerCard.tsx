import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Briefcase, BadgeCheck, ArrowRight } from 'lucide-react'
import type { LawyerDto } from '../../api/lawyers'
import { Badge } from '../ui/Badge'

interface LawyerCardProps {
  lawyer: LawyerDto
}

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function LawyerCard({ lawyer }: LawyerCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => navigate(`/lawyers/${lawyer.id}`)}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 16,
        padding: 22,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: '#0A0A0A',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {lawyer.fullName[0]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>{lawyer.fullName}</span>
              {lawyer.isVerified && <BadgeCheck size={15} color="#2563eb" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, color: '#6B6B6B', fontSize: 12 }}>
              <MapPin size={11} />
              {lawyer.city}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0A0A0A' }}>
            ${lawyer.hourlyRate}
            <span style={{ fontSize: 11, fontWeight: 400, color: '#6B6B6B' }}>/hr</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p
        style={{
          fontSize: 13,
          color: '#6B6B6B',
          lineHeight: 1.55,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {lawyer.bio}
      </p>

      {/* Specializations */}
      {lawyer.specializations.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {lawyer.specializations.slice(0, 3).map((s) => (
            <Badge key={s} variant="default">{s}</Badge>
          ))}
          {lawyer.specializations.length > 3 && (
            <Badge variant="default">+{lawyer.specializations.length - 3} more</Badge>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 14,
          borderTop: '1px solid #E8E8E8',
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontWeight: 600, color: '#0A0A0A' }}>{lawyer.rating.toFixed(1)}</span>
            <span style={{ color: '#6B6B6B' }}>({lawyer.reviewCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6B6B' }}>
            <Briefcase size={12} />
            {lawyer.experienceYears}y exp
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0A0A0A', fontWeight: 600 }}>
          View <ArrowRight size={13} />
        </div>
      </div>
    </motion.div>
  )
}
