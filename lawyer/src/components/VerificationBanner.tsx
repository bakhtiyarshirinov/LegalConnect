import { AlertTriangle } from 'lucide-react'
import { useVerificationStatus } from '../hooks/useVerificationStatus'

/**
 * Sticky red banner shown on every page while the lawyer's verification is revoked.
 * The portal stays usable read-only; all editing actions are disabled and refused
 * by the backend.
 */
export function VerificationBanner() {
  const { isRevoked } = useVerificationStatus()
  if (!isRevoked) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FEF2F2', borderBottom: '1px solid #FECACA',
        color: '#B91C1C', padding: '10px 24px', fontSize: 13, fontWeight: 500,
      }}
      role="alert"
    >
      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
      <span>
        Verifikasiyanız administrator tərəfindən ləğv edilib. Hesabınız yalnız
        oxu rejimindədir — görüşləri idarə etmək, cədvəl və profil dəyişiklikləri
        yeni verifikasiyaya qədər mümkün deyil.
      </span>
    </div>
  )
}
