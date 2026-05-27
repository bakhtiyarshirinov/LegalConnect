import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export const ProtectedRoute: React.FC = () => {
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'Admin') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <Sidebar />
      <main className="pl-56 pt-16 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
