import { Link, Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { getStoredUser } from '../services/auth'

const steps = [
  ['Find your person', 'Compare tutors by subject, experience, and hourly rate.'],
  ['Pick a time', 'Open a tutor’s calendar and choose a session that fits your week.'],
  ['Book your lesson', 'Confirm your booking and keep track of upcoming lessons in one place.'],
]

export default function Home() {
  const user = getStoredUser()
  if (user) return <Navigate to={user.role === 'TUTOR' ? '/tutor/setup' : '/discover'} replace />
  return <AppShell>
    <section className="lesson-hero">
      <div>
        <p className="eyebrow"><span className="signal" /> The one-to-one learning club</p>
        <h1>Your goals.<br />Your tutor.<br /><em>Your pace.</em></h1>
        <p className="hero-intro">Learn one-to-one with someone who knows their subject. Find a tutor, choose a time, and make it yours.</p>
        <Link className="action" to="/discover">Find my tutor <span aria-hidden="true">↗</span></Link>
      </div>
      <figure className="lesson-photo">
        <div className="photo-label">FIELD NOTES <span>/ 001</span></div>
        <img src="/images/lesson.jpg" alt="A learner taking notes during a one-to-one online lesson" width="960" height="640" />
        <figcaption><span className="signal" /> Inside a 1:1 lesson <span aria-hidden="true">✳</span></figcaption>
      </figure>
    </section>
    <section className="steps" id="how-it-works">
      <p className="eyebrow">The lesson guide</p>
      <h2>How SkillBook works</h2>
      <div className="step-grid">{steps.map(([title, body], i) => <article key={title}>
        <span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{body}</p>
      </article>)}</div>
    </section>
  </AppShell>
}
