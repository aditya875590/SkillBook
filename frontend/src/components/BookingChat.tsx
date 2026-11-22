import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'
import type { ApiResponse } from '../types'
import { Button } from './ui/Button'

interface Message { id: string; senderId: string; body: string }

export function BookingChat({ bookingId, userId, partner, direct=false }: { bookingId: string; userId: string; partner: string; direct?: boolean }) {
  const path = direct ? `/inbox/${bookingId}` : `/bookings/${bookingId}/messages`
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [live, setLive] = useState(false)
  const sequence = useRef(0)
  const refresh = useCallback(async () => {
    const seq = ++sequence.current
    try {
      const { data } = await api.get<ApiResponse<Message[]>>(path)
      if (!data.data) throw new Error()
      if (seq === sequence.current) { setMessages(data.data); setError('') }
    } catch {
      if (seq === sequence.current) setError('Could not load the conversation.')
    }
  }, [path])

  useEffect(() => {
    void refresh()
    if (direct) {
      const timer = window.setInterval(refresh,4000)
      return () => { sequence.current++; clearInterval(timer) }
    }
    const url = new URL(api.getUri({ url: `/live/bookings/${bookingId}` }), window.location.origin)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = localStorage.getItem('accessToken')
    let socket: WebSocket | undefined
    let stopped = false
    const connect = () => {
      if (socket && socket.readyState !== WebSocket.CLOSED) return
      socket = new WebSocket(url, token ? ['skillbook.chat', `bearer.${token}`] : ['skillbook.chat'])
      socket.onopen = () => { if (!stopped) { setLive(true); void refresh() } }
      socket.onmessage = () => { if (!stopped) void refresh() }
      socket.onclose = () => { if (!stopped) setLive(false) }
    }
    connect()
    const timer = window.setInterval(() => {
      if (socket?.readyState !== WebSocket.OPEN) { void refresh(); connect() }
    }, 10000)
    return () => { stopped = true; sequence.current++; clearInterval(timer); socket?.close() }
  }, [bookingId, direct, refresh])

  return <section className="mt-4 border-t border-border pt-4">
    <h3 className="text-base font-semibold">Conversation with {partner}</h3>
    <p className="text-xs text-text-secondary">{live ? 'Live updates' : 'Checking for updates'} · Latest 100 messages</p>
    {error && <p role="alert">{error} <button type="button" onClick={refresh} className="underline">Retry</button></p>}
    <ol aria-label="Chat messages" aria-live="polite" className="my-3 max-h-80 space-y-2 overflow-auto">
      {messages?.map(m => <li key={m.id} className="rounded-lg bg-surface-input p-3">
        <strong className="text-xs">{m.senderId === userId ? 'You' : partner}</strong>
        <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
      </li>)}
    </ol>
    {!error && !messages?.length && <p className="mb-3 text-sm">{messages ? 'Start the conversation below.' : 'Loading messages…'}</p>}
    <form onSubmit={async e => {
      e.preventDefault()
      if (!draft.trim() || sending) return
      setSending(true); setSendError('')
      try { await api.post(path, { body: draft.trim() }); setDraft(''); await refresh() }
      catch { setSendError('Message could not be sent. Please try again.') }
      finally { setSending(false) }
    }}>
      <label className="block text-sm font-semibold">Your message
        <textarea value={draft} onChange={e => setDraft(e.target.value)} maxLength={2000} disabled={sending}
          className="my-2 block w-full rounded-lg border border-border-input bg-surface-input p-3" />
      </label>
      {sendError && <p role="alert">{sendError}</p>}
      <Button type="submit" loading={sending} disabled={!draft.trim()}>Send message</Button>
    </form>
  </section>
}
