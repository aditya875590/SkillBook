import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { BookingChat } from '../components/BookingChat'
import { Avatar } from '../components/ui/Avatar'
import api from '../services/api'
import { getStoredUser } from '../services/auth'

interface Contact { id: string; name: string }
export default function Inbox() {
  const user=getStoredUser()
  const [params,setParams]=useSearchParams()
  const peer=params.get('to')
  const [contacts,setContacts]=useState<Contact[]>([])
  const [error,setError]=useState('')
  const me=user?.id
  useEffect(()=>{
    if (!me) return
    let active=true
    const load=()=>api.get('/inbox').then(({data})=>{if(active){setContacts(data.data);setError('')}})
      .catch(()=>{if(active)setError('Could not load conversations.')})
    void load(); const timer=setInterval(load,5000)
    return ()=>{active=false;clearInterval(timer)}
  },[me])
  if(!user)return <Navigate to="/login" replace/>
  const partner=contacts.find(c=>c.id===peer)?.name || params.get('name') || 'Tutor'
  return <AppShell><header className="workspace-head"><p className="eyebrow">Your notebook</p><h1>Messages</h1>
    <p>Discuss a goal or ask about a time before booking.</p></header>
    {error && <p role="alert">{error}</p>}
    <div className="my-5 grid gap-5 md:grid-cols-[1fr_2fr]">
      <nav aria-label="Conversations" className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold">Conversations</h2>
        {contacts.map(c=><button key={c.id} onClick={()=>setParams({to:c.id})} className="my-2 flex items-center gap-2 text-primary"><Avatar size="sm" name={c.name} userId={c.id}/>{c.name}</button>)}
        {!contacts.length && <p className="mt-3 text-sm">No messages yet.</p>}
      </nav>
      <div className="rounded-xl border border-border bg-surface p-4">{peer ?
        <BookingChat key={peer} direct bookingId={peer} userId={user.id} partner={partner}/> :
        <p>Select a conversation{user.role==='STUDENT' && <> or <Link className="underline" to="/discover">find a tutor to message</Link></>}.</p>}</div>
    </div></AppShell>
}
