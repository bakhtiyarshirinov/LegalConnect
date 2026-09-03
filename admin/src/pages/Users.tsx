import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users as UsersIcon, CheckCircle, XCircle } from 'lucide-react'
import { getAllUsers } from '../api/admin'
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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' as const },
  }),
}

export const Users: React.FC = () => {
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['all-users'],
    queryFn: getAllUsers,
    retry: false,
  })

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Bütün İstifadəçilər</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">Platforma istifadəçilərini idarə edin</p>
      </motion.div>

      {/* Count */}
      {!isLoading && !isError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-sm font-medium text-[#6B6B6B]">
            <UsersIcon className="w-3.5 h-3.5" />
            {users.length} ümumi istifadəçi
          </span>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && <Skeleton count={6} className="h-16 w-full" />}

      {/* Error */}
      {isError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-14 h-14 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mb-4">
            <UsersIcon className="w-7 h-7 text-[#6B6B6B]" />
          </div>
          <p className="text-lg font-semibold text-[#0A0A0A] mb-1">Tezliklə</p>
          <p className="text-sm text-[#6B6B6B]">İstifadəçi idarəetməsi funksiyası hazırlanır</p>
        </motion.div>
      )}

      {/* Table */}
      {!isLoading && !isError && users.length > 0 && (
        <Card padding="sm">
          {/* Table header */}
          <div className="grid grid-cols-12 px-4 py-3 border-b border-[#E8E8E8] text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
            <div className="col-span-4">İstifadəçi</div>
            <div className="col-span-3">E-poçt</div>
            <div className="col-span-2">Rol</div>
            <div className="col-span-2">Təsdiqləndi</div>
            <div className="col-span-1">Qoşulub</div>
          </div>

          {/* Rows */}
          <div>
            {users.map((user, i) => (
              <motion.div key={user.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <Link
                to={`/users/${user.id}`}
                className="grid grid-cols-12 px-4 py-3.5 border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAFA] transition-colors items-center cursor-pointer"
              >
                {/* Avatar + name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center text-sm font-semibold text-[#0A0A0A] flex-shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#0A0A0A] truncate">{user.fullName}</span>
                </div>

                {/* Email */}
                <div className="col-span-3">
                  <span className="text-sm text-[#6B6B6B] truncate block">{user.email}</span>
                </div>

                {/* Role */}
                <div className="col-span-2">
                  <Badge variant={roleBadge(user.role) as Parameters<typeof Badge>[0]['variant']}>
                    {user.role}
                  </Badge>
                </div>

                {/* Verified */}
                <div className="col-span-2">
                  {user.isVerified ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Təsdiqləndi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#6B6B6B] text-xs">
                      <XCircle className="w-3.5 h-3.5" /> Gözləyir
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="col-span-1">
                  <span className="text-xs text-[#6B6B6B]">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mb-4">
            <UsersIcon className="w-7 h-7 text-[#6B6B6B]" />
          </div>
          <p className="text-lg font-semibold text-[#0A0A0A]">İstifadəçi tapılmadı</p>
          <p className="text-sm text-[#6B6B6B] mt-1">Platformada hələ qeydiyyatdan keçmiş istifadəçi yoxdur</p>
        </div>
      )}
    </div>
  )
}
