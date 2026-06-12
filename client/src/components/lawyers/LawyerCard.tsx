import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Briefcase, BadgeCheck, ArrowRight } from 'lucide-react'
import type { LawyerDto } from '../../api/lawyers'

interface LawyerCardProps {
  lawyer: LawyerDto
}

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function LawyerCard({ lawyer }: LawyerCardProps) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      variants={cardVariants}
      onClick={() => navigate(`/lawyers/${lawyer.id}`)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #F0F0F0',
        borderRadius: 16,
        padding: 22,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Avatar + Name + Price */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}>
            {lawyer.avatarUrl ? (
              <img src={lawyer.avatarUrl} alt={lawyer.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%', background: '#0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#fff',
              }}>
                {lawyer.fullName[0]}
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0A0A0A' }}>{lawyer.fullName}</span>
              {lawyer.isVerified && <BadgeCheck size={15} color="#3B5BDB" />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B6B6B', fontSize: 12 }}>
              <MapPin size={11} />
              {lawyer.city}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.03em' }}>
            ${lawyer.hourlyRate}
          </div>
          <div style={{ fontSize: 11, color: '#6B6B6B' }}>/saat</div>
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

      {/* Specialization chips */}
      {lawyer.specializations.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {lawyer.specializations.slice(0, 3).map((s) => (
            <span
              key={s}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: '#F5F5F5',
                color: '#6B6B6B',
                border: '1px solid #F0F0F0',
              }}
            >
              {s}
            </span>
          ))}
          {lawyer.specializations.length > 3 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: '#F5F5F5',
                color: '#6B6B6B',
                border: '1px solid #F0F0F0',
              }}
            >
              +{lawyer.specializations.length - 3}
            </span>
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
          borderTop: '1px solid #F5F5F5',
          marginTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#0A0A0A' }}>{lawyer.rating.toFixed(1)}</span>
            <span style={{ color: '#A3A3A3' }}>({lawyer.reviewCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6B6B' }}>
            <Briefcase size={12} />
            {lawyer.experienceYears}y
          </div>
        </div>

        {/* View Profile button — shows on hover */}
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 6 }}
          transition={{ duration: 0.15 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            color: '#0A0A0A',
            background: '#F5F5F5',
            border: '1px solid #F0F0F0',
            borderRadius: 8,
            padding: '4px 10px',
          }}
        >
          Profili gör <ArrowRight size={12} />
        </motion.div>
      </div>
    </motion.div>
  )
}
