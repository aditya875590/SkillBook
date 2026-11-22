import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage, googleLogin } from '../services/auth'

type GoogleId = {
  initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void
  renderButton: (element: HTMLElement, options: Record<string, string>) => void
}
declare global { interface Window { google?: { accounts: { id: GoogleId } } } }
let loader: Promise<void> | undefined
function loadGoogle() {
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => resolve()
    script.onerror = () => { loader = undefined; script.remove(); reject(new Error('Google sign-in failed to load')) }
    document.head.appendChild(script)
  })
  return loader
}
export function GoogleButton({role='STUDENT',link=false,done}: {
  role?: 'STUDENT'|'TUTOR'; link?: boolean; done: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const latest = useRef({ role, done }); latest.current = {role, done}
  const [error,setError] = useState('')
  useEffect(() => {
    let active = true
    async function setup() {
      const {data} = await api.get('/auth/google')
      if (!active || !data.data) return
      await loadGoogle()
      const id = window.google?.accounts.id
      if (!active || !root.current || !id) return
      id.initialize({client_id:data.data,callback:async ({credential}) => {
        try {
          if (link) await api.post('/account/google',{credential})
          else await googleLogin(credential,latest.current.role)
          if (active) latest.current.done()
        } catch (e) { if (active) setError(apiErrorMessage(e,'Google sign-in failed')) }
      }})
      id.renderButton(root.current,{theme:'outline',size:'large',text:link?'continue_with':'signin_with'})
    }
    setup().catch(() => { if(active) setError('Google sign-in is unavailable.') })
    return () => { active=false }
  },[link])
  return <><div className="my-3" ref={root}/>{error && <p role="alert">{error}</p>}</>
}
