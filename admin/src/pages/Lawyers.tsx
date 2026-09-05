import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircle, MapPin, Briefcase, DollarSign, Hash, Star, XCircle, AlertTriangle } from 'lucide-react'
import {
  getPendingLawyers,
  verifyLawyer,
  getVerifiedLawyers,
  cancelLawyerVerification,
  rejectLawyer,
} from '../api/admin'
import type { VerifiedLawyer, PendingLawyer } from '../types'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { LawyerCardSkeleton } from '../components/ui/Skeleton'

const REASON_MIN = 10

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
}

const apiErrorMessage = (err: unknown): string => {
  const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
  return msg || 'Əməliyyat alınmadı. Yenidən cəhd edin.'
}

export const Lawyers: React.FC = () => {
  const queryClient = useQueryClient()

  // ─── Pending (unchanged primary verify flow) ──────────────────────────────
  const { data: pending = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-lawyers'],
    queryFn: getPendingLawyers,
  })

  const { mutate: verify, isPending: verifying, variables: verifyingId } = useMutation({
    mutationFn: verifyLawyer,
    onSuccess: (_, id) => {
      toast.success('Vəkil təsdiqləndi!')
      const verifiedLawyer = pending.find((l) => l.id === id)
      queryClient.setQueryData<typeof pending>(['pending-lawyers'], (old = []) =>
        old.filter((l) => l.id !== id)
      )
      if (verifiedLawyer) {
        queryClient.setQueryData<VerifiedLawyer[]>(['verified-lawyers'], (old = []) =>
          old.some((l) => l.id === id) ? old : [...old, verifiedLawyer]
        )
      } else {
        queryClient.invalidateQueries({ queryKey: ['verified-lawyers'] })
      }
      // Verifying changes the user's role/status row too (all-users), whose shape
      // isn't reconstructable client-side from a PendingLawyer — refetch it.
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
    },
    onError: () => toast.error('Təsdiqləmə alınmadı. Yenidən cəhd edin.'),
  })

  // ─── Verified + cancel-verification ───────────────────────────────────────
  const { data: verified = [], isLoading: verifiedLoading } = useQuery({
    queryKey: ['verified-lawyers'],
    queryFn: getVerifiedLawyers,
  })

  const [cancelTarget, setCancelTarget] = useState<VerifiedLawyer | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingLawyer | null>(null)
  const [reason, setReason] = useState('')

  const closeModal = () => {
    setCancelTarget(null)
    setRejectTarget(null)
    setReason('')
  }

  const { mutate: cancelVerification, isPending: cancelling } = useMutation({
    mutationFn: cancelLawyerVerification,
    onSuccess: (_, { lawyerId }) => {
      toast.success('Vəkilin verifikasiyası ləğv edildi')
      queryClient.setQueryData<VerifiedLawyer[]>(['verified-lawyers'], (old = []) =>
        old.filter((l) => l.id !== lawyerId)
      )
      // Backend clears IsVerified but leaves RejectedAt null, so GetPendingAsync's
      // `!IsVerified && RejectedAt == null` filter picks the lawyer back up immediately —
      // append the row we already have instead of a full pending-lawyers refetch.
      if (cancelTarget) {
        queryClient.setQueryData<typeof pending>(['pending-lawyers'], (old = []) =>
          old.some((l) => l.id === lawyerId) ? old : [...old, cancelTarget]
        )
      } else {
        queryClient.invalidateQueries({ queryKey: ['pending-lawyers'] })
      }
      closeModal()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: rejectLawyer,
    onSuccess: (_, { lawyerId }) => {
      toast.success('Müraciət rədd edildi')
      queryClient.setQueryData<typeof pending>(['pending-lawyers'], (old = []) =>
        old.filter((l) => l.id !== lawyerId)
      )
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      closeModal()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const reasonValid = reason.trim().length >= REASON_MIN

  const submitCancel = () => {
    if (!cancelTarget || !reasonValid || cancelling) return
    cancelVerification({ lawyerId: cancelTarget.id, reason: reason.trim() })
  }

  const submitReject = () => {
    if (!rejectTarget || !reasonValid || rejecting) return
    reject({ lawyerId: rejectTarget.id, reason: reason.trim() })
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Vəkillər</h1>
        <p className="text-[#6B6B6B] text-sm mt-1">
          Gözləyən qeydiyyatları təsdiqləyin və təsdiqlənmiş vəkilləri idarə edin
        </p>
      </motion.div>

      {/* ─── Pending section ─────────────────────────────────────────────── */}
      {!pendingLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-sm font-medium text-[#6B6B6B]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {pending.length} gözləyən vəkil
          </span>
        </motion.div>
      )}

      {pendingLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <LawyerCardSkeleton key={i} />)}
        </div>
      )}

      {!pendingLoading && pending.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-xl font-semibold text-[#0A0A0A] mb-1">Bütün vəkillər təsdiqləndi ✓</p>
          <p className="text-sm text-[#6B6B6B]">Hazırda gözləyən təsdiq yoxdur</p>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {pending.map((lawyer, i) => (
            <motion.div key={lawyer.id} layout custom={i} initial="hidden" animate="visible" exit="exit" variants={fadeUp}>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-[#0A0A0A]">{lawyer.fullName}</h3>
                      <Badge variant="pending">Təsdiq gözləyir</Badge>
                    </div>
                    <p className="text-sm text-[#6B6B6B] mb-4">{lawyer.email}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><MapPin className="w-3 h-3" /> Şəhər</div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.city}</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><Briefcase className="w-3 h-3" /> Təcrübə</div>
                        <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.experienceYears} il</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><DollarSign className="w-3 h-3" /> Qiymət</div>
                        <p className="text-sm font-medium text-[#0A0A0A]">${lawyer.hourlyRate}/saat</p>
                      </div>
                      <div className="bg-[#F5F5F5] rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><Hash className="w-3 h-3" /> Lisenziya</div>
                        <p className="text-sm font-medium text-[#0A0A0A] truncate">{lawyer.licenseNumber}</p>
                      </div>
                    </div>

                    {lawyer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lawyer.specializations.map((spec) => (
                          <span key={spec} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-medium">
                            <Star className="w-2.5 h-2.5" />
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <Button variant="success" size="md" loading={verifying && verifyingId === lawyer.id} onClick={() => verify(lawyer.id)}>
                      <CheckCircle className="w-4 h-4" />
                      Təsdiqlə
                    </Button>
                    <Button variant="danger" size="md" onClick={() => setRejectTarget(lawyer)}>
                      <XCircle className="w-4 h-4" />
                      Rədd et
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Verified section ────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-[#0A0A0A]">Təsdiqlənmiş vəkillər</h2>
          {!verifiedLoading && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs font-medium text-[#6B6B6B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {verified.length}
            </span>
          )}
        </div>

        {verifiedLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => <LawyerCardSkeleton key={i} />)}
          </div>
        )}

        {!verifiedLoading && verified.length === 0 && (
          <p className="text-sm text-[#6B6B6B] py-6">Təsdiqlənmiş vəkil yoxdur.</p>
        )}

        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {verified.map((lawyer, i) => (
              <motion.div key={lawyer.id} layout custom={i} initial="hidden" animate="visible" exit="exit" variants={fadeUp}>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-[#0A0A0A]">{lawyer.fullName}</h3>
                        <Badge variant="success">Təsdiqlənib</Badge>
                      </div>
                      <p className="text-sm text-[#6B6B6B] mb-4">{lawyer.email}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[#F5F5F5] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><MapPin className="w-3 h-3" /> Şəhər</div>
                          <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.city}</p>
                        </div>
                        <div className="bg-[#F5F5F5] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><Briefcase className="w-3 h-3" /> Təcrübə</div>
                          <p className="text-sm font-medium text-[#0A0A0A]">{lawyer.experienceYears} il</p>
                        </div>
                        <div className="bg-[#F5F5F5] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><DollarSign className="w-3 h-3" /> Qiymət</div>
                          <p className="text-sm font-medium text-[#0A0A0A]">${lawyer.hourlyRate}/saat</p>
                        </div>
                        <div className="bg-[#F5F5F5] rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-[#6B6B6B] text-xs mb-1"><Hash className="w-3 h-3" /> Lisenziya</div>
                          <p className="text-sm font-medium text-[#0A0A0A] truncate">{lawyer.licenseNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button variant="danger" size="md" onClick={() => setCancelTarget(lawyer)}>
                        <XCircle className="w-4 h-4" />
                        Verifikasiyanı ləğv et
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Cancel-verification confirm modal ───────────────────────────── */}
      <Modal
        open={cancelTarget !== null}
        onClose={() => { if (!cancelling) closeModal() }}
        title={
          <span>
            Vəkilin verifikasiyasını ləğv et
            {cancelTarget && <span className="text-[#6B6B6B] font-normal"> — {cancelTarget.fullName}</span>}
          </span>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-[#FFF1F0] border border-[#FFCCC7] rounded-xl mb-4">
          <AlertTriangle className="w-5 h-5 text-[#E03131] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#611A15]">
            Vəkil təsdiqlənmiş statusunu itirəcək və axtarış nəticələrində görünməyəcək.
            Yeni müraciətlər qəbul edə bilməz, nə vaxt ki, admin onu yenidən təsdiqləyir.
          </p>
        </div>

        <label className="text-sm font-medium text-[#0A0A0A]">Ləğv etmə səbəbi</label>
        <textarea
          className="mt-1.5 w-full min-h-[110px] border border-[#E8E8E8] rounded-xl bg-white text-[#0A0A0A] placeholder:text-[#6B6B6B] text-sm p-3 outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition-all resize-y"
          placeholder="Ən azı 10 simvol — səbəb vəkilə bildiriş olaraq göndəriləcək"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={cancelling}
          autoFocus
        />
        <p className="text-xs text-[#6B6B6B] mt-1">
          {reason.trim().length < REASON_MIN
            ? `Daha ${Math.max(REASON_MIN - reason.trim().length, 0)} simvol lazımdır`
            : `${reason.trim().length} simvol`}
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="md" onClick={closeModal} disabled={cancelling}>
            İmtina
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={submitCancel}
            loading={cancelling}
            disabled={!reasonValid}
          >
            Ləğvi təsdiqlə
          </Button>
        </div>
      </Modal>

      {/* ─── Reject-application confirm modal ────────────────────────────── */}
      <Modal
        open={rejectTarget !== null}
        onClose={() => { if (!rejecting) closeModal() }}
        title={
          <span>
            Müraciəti rədd et
            {rejectTarget && <span className="text-[#6B6B6B] font-normal"> — {rejectTarget.fullName}</span>}
          </span>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-[#FFF1F0] border border-[#FFCCC7] rounded-xl mb-4">
          <AlertTriangle className="w-5 h-5 text-[#E03131] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#611A15]">
            Vəkil təsdiqlənməyəcək və gözləyən siyahısından çıxarılacaq. Səbəb ona
            bildiriş olaraq göndəriləcək; o, profilini yeniləyərək təkrar müraciət
            edə bilər.
          </p>
        </div>

        <label className="text-sm font-medium text-[#0A0A0A]">Rədd etmə səbəbi</label>
        <textarea
          className="mt-1.5 w-full min-h-[110px] border border-[#E8E8E8] rounded-xl bg-white text-[#0A0A0A] placeholder:text-[#6B6B6B] text-sm p-3 outline-none focus:border-[#0A0A0A] focus:ring-2 focus:ring-[#0A0A0A]/10 transition-all resize-y"
          placeholder="Ən azı 10 simvol — səbəb vəkilə bildiriş olaraq göndəriləcək"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={rejecting}
          autoFocus
        />
        <p className="text-xs text-[#6B6B6B] mt-1">
          {reason.trim().length < REASON_MIN
            ? `Daha ${Math.max(REASON_MIN - reason.trim().length, 0)} simvol lazımdır`
            : `${reason.trim().length} simvol`}
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="secondary" size="md" onClick={closeModal} disabled={rejecting}>
            İmtina
          </Button>
          <Button variant="danger" size="md" onClick={submitReject} loading={rejecting} disabled={!reasonValid}>
            Rədd et
          </Button>
        </div>
      </Modal>
    </div>
  )
}
