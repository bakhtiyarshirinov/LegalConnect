export interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  token: string;
}

export interface Lawyer {
  id: string;
  fullName: string;
  city: string;
  bio: string;
  experienceYears: number;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  specializations: string[];
  avatarUrl?: string;
}

export interface Appointment {
  id: string;
  lawyerId: string;
  lawyerFullName: string;
  clientFullName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  type: string;
  price: number;
  notes?: string;
}

export interface Chat {
  id: string;
  lawyerFullName: string;
  clientFullName: string;
  lastMessageAt?: string;
  lastMessage?: string;
  unreadCount?: number;
  lawyerId?: string;
  clientId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderFullName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  clientFullName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Specialization {
  id: string;
  name: string;
}

export interface LawyerStats {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  rating: number;
}
