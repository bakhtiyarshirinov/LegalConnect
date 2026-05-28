import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export default function ProtectedRoute() {
  const { token, user } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'Lawyer') {
    return <Navigate to="/login" replace />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#FAFAFA',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
