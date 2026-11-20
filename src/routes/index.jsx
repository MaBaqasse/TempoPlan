import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '@/layouts/PublicLayout'
import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import ForgotPassword from '@/pages/ForgotPassword'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Planning from '@/pages/Planning'
import Activities from '@/pages/Activities'
import Goals from '@/pages/Goals'
import Stats from '@/pages/Stats'
import Assistant from '@/pages/Assistant'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="planning" element={<Planning />} />
          <Route path="activities" element={<Activities />} />
          <Route path="goals" element={<Goals />} />
          <Route path="stats" element={<Stats />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
