import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../services/auth'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import type { Skill } from '../types'

interface Match { id: string; name: string; matched: number; wanted: number }

export function SkillMatches() {
  const [goals, setGoals] = useState('')
  const [matches, setMatches] = useState<Match[]>([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([api.get('/students/profile/skills'), api.get('/students/matches')])
      .then(([skills, list]) => {
        if (!active) return
        setGoals(skills.data.data.map((s: Skill) => s.name).join(', '))
        setMatches(list.data.data)
      })
      .catch(() => { if (active) setStatus('Could not load learning goals.') })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [])

  return <details className="mb-4 rounded-xl border border-border bg-surface p-4">
    <summary className="cursor-pointer font-semibold">Match tutors to my learning goals</summary>
    <form className="my-3 space-y-2" onSubmit={async e => {
      e.preventDefault()
      setBusy(true)
      setStatus('')
      try {
        await api.put('/students/profile/skills', { skills: goals.split(',').map(s => s.trim()).filter(Boolean) })
        const { data } = await api.get('/students/matches')
        setMatches(data.data)
        setStatus(data.data.length ? 'Best matches first.' : 'No tutor matches these goals yet.')
      } catch (err) {
        setStatus(apiErrorMessage(err, 'Could not update goals.'))
      } finally {
        setBusy(false)
      }
    }}>
      <Input label="Skills I want to learn" hint="Separate skills with commas." value={goals} onChange={e => setGoals(e.target.value)} disabled={busy}/>
      <Button type="submit" disabled={busy}>Find matches</Button>
    </form>
    {status && <p role="status">{status}</p>}
    {matches.map(m => <Link key={m.id} to={`/tutors/${m.id}`} className="block py-1 text-primary underline">
      {m.name} · {m.matched} of {m.wanted} goals matched
    </Link>)}
  </details>
}
