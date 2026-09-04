import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getMyLawyerProfile } from '../api/profile'

/**
 * Verification state of the logged-in lawyer. `isRevoked` is true once an admin has
 * revoked verification — the backend then serves the portal read-only (403 +
 * code "lawyer_verification_revoked" on every write).
 */
export function useVerificationStatus() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading } = useQuery({
    queryKey: ['lawyer-profile'],
    queryFn: getMyLawyerProfile,
    enabled: !!user,
    staleTime: 30_000,
  })

  return {
    isLoading,
    isRevoked: data ? data.isVerified === false : false,
  }
}
