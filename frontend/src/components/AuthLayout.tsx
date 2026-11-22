import type { ReactNode } from 'react'
import { Brand } from './Brand'
import { DarkModeToggle } from './ui/DarkModeToggle'

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-page">
    <header><Brand /><DarkModeToggle /></header>
    <main className="auth-spread">
      <aside>
        <p className="eyebrow">The SkillBook notebook</p>
        <h2>Room to<br /><em>grow.</em></h2>
        <img src="/images/lesson.jpg" width="960" height="640" alt="An online lesson in progress" />
      </aside>
      <div className="auth-form">{children}</div>
    </main>
  </div>
}
export default AuthLayout
