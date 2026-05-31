import api from './axios';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  registerClient: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/auth/register/client', data),

  registerLawyer: (data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    bio: string;
    city: string;
    licenseNumber: string;
    experienceYears: number;
    hourlyRate: number;
    specializationIds: string[];
  }) => api.post('/auth/register/lawyer', data),

  verifyOtp: (email: string, code: string) =>
    api.post('/auth/verify-otp', { email, code }),

  resendOtp: (email: string) =>
    api.post('/auth/resend-otp', { email }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, token, newPassword }),

  updateProfile: (data: { fullName: string; phone: string }) =>
    api.put('/users/me', data),
};
