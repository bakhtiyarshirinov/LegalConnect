import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'

// Layout
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import RegisterClient from './pages/auth/RegisterClient'
import RegisterLawyer from './pages/auth/RegisterLawyer'
import VerifyOtp from './pages/auth/VerifyOtp'

import ClientDashboard from './pages/client/Dashboard'
import Lawyers from './pages/client/Lawyers'
import LawyerProfilePage from './pages/client/LawyerProfile'
import Chat from './pages/client/Chat'
import Notifications from './pages/client/Notifications'
import ClientAppointments from './pages/client/Appointments'

import LawyerDashboard from './pages/lawyer/Dashboard'
import LawyerProfile from './pages/lawyer/Profile'
import LawyerAppointments from './pages/lawyer/Appointments'

import AdminDashboard from './pages/admin/Dashboard'
import LawyerVerification from './pages/admin/LawyerVerification'

import NotFound from './pages/NotFound'

// Layout wrapper for authenticated pages — stable across navigations
function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F5F5F5' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/client" element={<RegisterClient />} />
        <Route path="/register/lawyer" element={<RegisterLawyer />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected — with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Client routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['Client']}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/lawyers" element={<Lawyers />} />
          <Route path="/lawyers/:id" element={<LawyerProfilePage />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute roles={['Client', 'Lawyer']}>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute roles={['Client']}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute roles={['Client']}>
                <ClientAppointments />
              </ProtectedRoute>
            }
          />

          {/* Lawyer routes */}
          <Route
            path="/lawyer/dashboard"
            element={
              <ProtectedRoute roles={['Lawyer']}>
                <LawyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lawyer/profile"
            element={
              <ProtectedRoute roles={['Lawyer']}>
                <LawyerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lawyer/appointments"
            element={
              <ProtectedRoute roles={['Lawyer']}>
                <LawyerAppointments />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lawyers"
            element={
              <ProtectedRoute roles={['Admin']}>
                <LawyerVerification />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
