import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { DarkModeToggle } from './ui/DarkModeToggle'
import { NotificationBell } from './NotificationBell'
import { Brand } from './Brand'
import { Avatar } from './ui/Avatar'
import { getStoredUser, clearSession } from '../services/auth'

function AppShell({ children, photoVersion = 0 }: { children: ReactNode; photoVersion?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getStoredUser()

  const [logoutError,setLogoutError] = useState('')
  const handleLogout = async () => {
    try {await clearSession();navigate('/login', { replace: true })}
    catch {setLogoutError('Could not sign out. Please try again.')}
  }

  const navLinks = user
    ? [
        ...(user.role !== 'TUTOR' ? [{ to: '/discover', label: 'Find a Tutor' }] : []),
        ...(user.role !== 'ADMIN' ? [{to:'/inbox',label:'Messages'}] : []),
        {to:'/account',label:'Account & DP'},
        ...(user.role === 'TUTOR'
          ? [
              { to: '/tutor/setup', label: 'My Profile' },
              { to: '/tutor/availability', label: 'Availability' },
            ]
          : []),
        ...(user.role === 'STUDENT' || user.role === 'TUTOR'
          ? [{ to: '/bookings', label: 'My Bookings' }]
          : []),
      ]
    : [{ to: '/discover', label: 'Find a tutor' }, { to: '/register?role=tutor', label: 'Become a tutor' }]

  const isActive = (to: string) => location.pathname === to

  return (
    <div className="site min-h-screen bg-surface-secondary">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors no-underline ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-input hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <DarkModeToggle />
            {user ? (
              <>
                 <NotificationBell />
                {(user.role === 'STUDENT' || user.role === 'TUTOR') && (
                  <Link to="/account#profile-photo" aria-label="Add or change DP" title="Add or change DP"
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Avatar name={user.name} userId={user.id} version={photoVersion} size="sm"/>
                  </Link>
                )}
                <span className="hidden text-sm font-medium text-text-secondary lg:inline">
                  {user.name}
                </span>
                <div className="h-5 w-px bg-border hidden sm:block" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-input hover:text-text"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-text-on-primary transition-colors no-underline hover:bg-primary-hover"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="ml-1 rounded-lg p-2 text-text-secondary hover:bg-surface-input md:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {mobileOpen ? (
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                ) : (
                  <path d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border bg-surface px-4 pb-4 pt-2 md:hidden" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium no-underline ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-input hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="site-main mx-auto w-full max-w-6xl px-4 py-8">{logoutError && <p role="alert">{logoutError}</p>}{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <p className="m-0 text-sm text-text-secondary/70">
            © {new Date().getFullYear()} SkillBook. All rights reserved.
          </p>
          <p className="m-0 text-sm text-text-secondary/70">
            One-to-one learning
          </p>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
export { AppShell }
