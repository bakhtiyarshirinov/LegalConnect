import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CheckCircle,
  MapPin,
  Briefcase,
  DollarSign,
  Hash,
  Star,
} from 'lucide-react'
import { getPendingLawyers, verifyLawyer } from '../api/admin'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LawyerCardSkeleton } from '../components/ui/Skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
}

export const Lawyers: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: lawyers = [], isLoading } = useQuery({
    queryKey: ['pending-lawyers'],
    queryFn: getPendingLawyers,
  })

  const { mutate: verify, isPending: verifying, variables: verifyingId } = useMutation({
    mutationFn: verifyLawyer,
    onSuccess: (_, id) => {
      toast.success('Lawyer verified!')
      queryClient.setQueryData<typeof lawyers>(['pending-lawyers'], (old = []) =>
        old.filter((l) => l.id !== id)
      )
    },
    onError: () => toast.error('Verification failed. Try again.'),
  })

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Lawyer Verification</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Review and approve pending lawyer registrations
        </p>
      </motion.div>

      {/* Count chip */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-sm font-medium text-[#6B6B6B]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {lawyers.length} pending {lawyers.length === 1 ? 'lawyer' : 'lawyers'}
          </span>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <LawyerCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && lawyers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-xl font-semibold text-[#0A0A0A] mb-1">All lawyers verified ✓</p>
          <p className="text-sm text-[#6B6B6B]">No pending verifications at the moment</p>
        </motion.div>
      )}

      {/* List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {lawyers.map((lawyer, i) => (
            <motion.div
              key={lawyer.id}
              layout
              custom={i}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUp}
            >
              <Card>
                <div className="flex items-start justify-between gap-4">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-[#0A0A0A]">{lawyer.fullName}</h3>
                      <Badge variant="pending">Pending Verification</Badge>
                    </div>
                    <p className="text-sm text-[#6B6B6B] mb-4">{lawyer.email}</p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1">
                          <MapPin className="w-3 h-3" /> City
                        </div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.city}</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1">
                          <Briefcase className="w-3 h-3" /> Experience
                        </div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.experienceYears} years</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1">
                          <DollarSign className="w-3 h-3" /> Rate
                        </div>
                        <p className="text-sm font-medium text-[#0A0A0A]">${lawyer.hourlyRate}/hr</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1">
                          <Hash className="w-3 h-3" /> License
                        </div>
                        <p className="text-sm font-medium text-[#0A0A0A] truncate">{lawyer.licenseNumber}</p>
                      </div>
                    </div>

                    {/* Specializations */}
                    {lawyer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lawyer.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium"
                          >
                            <Star className="w-2.5 h-2.5" />
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="success"
                      size="md"
                      loading={verifying && verifyingId === lawyer.id}
                      onClick={() => verify(lawyer.id)}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
