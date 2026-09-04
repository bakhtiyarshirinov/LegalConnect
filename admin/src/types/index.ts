export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  token: string
}

export interface PendingLawyer {
  id: string
  userId: string
  fullName: string
  email: string
  city: string
  licenseNumber: string
  experienceYears: number
  hourlyRate: number
  specializations: string[]
}

export interface VerifiedLawyer {
  id: string
  userId: string
  fullName: string
  email: string
  city: string
  licenseNumber: string
  experienceYears: number
  hourlyRate: number
  specializations: string[]
}

export interface UserAdmin {
  id: string
  fullName: string
  email: string
  role: string
  isVerified: boolean
  createdAt: string
  /** "Verified" | "Pending" | "Rejected" for lawyer rows; null otherwise. */
  lawyerStatus: string | null
}

export interface LawyerProfileInfo {
  lawyerId: string
  city: string
  licenseNumber: string
  experienceYears: number
  hourlyRate: number
  rating: number
  reviewCount: number
  isVerified: boolean
  isAvailable: boolean
  specializations: string[]
  cancellationReason: string | null
  cancelledAt: string | null
  rejectionReason: string | null
  rejectedAt: string | null
}

export interface ActivitySummary {
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  completedAppointments: number
  cancelledAppointments: number
}

export interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isVerified: boolean
  createdAt: string
  lastSeen: string | null
  avatarUrl: string | null
  lawyer: LawyerProfileInfo | null
  activity: ActivitySummary
}

export interface LoginResponse {
  token: string
  userId: string
  email: string
  fullName: string
  role: string
}

export interface AdminStats {
  totalUsers: number
  verifiedLawyers: number
  pendingApprovals: number
}
