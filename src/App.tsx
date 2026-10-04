import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Users } from '@/pages/Users'
import { Astrologers } from '@/pages/Astrologers'
import { Posts } from '@/pages/Posts'
import { PrivacyPolicy } from '@/pages/PrivacyPolicy'
import { DeleteAccount } from '@/pages/DeleteAccount'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/astrologers" element={<Astrologers />} />
            <Route path="/posts" element={<Posts />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
