import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Account from './pages/Account'
import Inbox from './pages/Inbox'
import Discover from './pages/Discover'
import TutorSetup from './pages/TutorSetup'
import TutorAvailabilityPage from './pages/TutorAvailabilityPage'
import TutorProfilePage from './pages/TutorProfilePage'
import MyBookingsPage from './pages/MyBookingsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/tutors/:userId" element={<TutorProfilePage />} />
      <Route path="/tutor/setup" element={<TutorSetup />} />
      <Route path="/tutor/availability" element={<TutorAvailabilityPage />} />
      <Route path="/bookings" element={<MyBookingsPage />} />
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
