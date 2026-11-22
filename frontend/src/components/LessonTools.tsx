import { useEffect,useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../services/auth'
import type { Booking } from '../types'
import { Button } from './ui/Button'
import { Input } from './ui/Input'

export function LessonTools({b,tutor}:{b:Booking;tutor:boolean}) {
  const [link,setLink]=useState(b.meetingUrl || ''),[saved,setSaved]=useState(b.meetingUrl)
  const [comment,setComment]=useState(''),[stars,setStars]=useState(5),[reviewed,setReviewed]=useState(false)
  const [status,setStatus]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{setSaved(b.meetingUrl);setLink(b.meetingUrl || '')},[b.meetingUrl])
  return <div className="mt-3 space-y-2">
    {b.status==='CONFIRMED' && <>
      {saved && <a className="font-semibold text-primary underline" href={saved} target="_blank" rel="noreferrer">Join video lesson ↗</a>}
      {tutor && <details><summary className="cursor-pointer text-sm font-semibold">{saved?'Edit':'Add'} lesson link</summary>
        <form className="mt-2 space-y-2" onSubmit={async e=>{
          e.preventDefault();setBusy(true)
          try{await api.put(`/bookings/${b.id}/meeting`,{url:link});setSaved(link);setStatus('Link shared with the student.')}
          catch(err){setStatus(apiErrorMessage(err,'Could not share link.'))}finally{setBusy(false)}
        }}><Input type="url" label="Zoom or Google Meet URL" required value={link} onChange={e=>setLink(e.target.value)}/><Button disabled={busy} type="submit">Share lesson link</Button></form>
      </details>}
      {!tutor && !saved && <p className="text-sm text-text-secondary">Your tutor can share a lesson link here.</p>}
    </>}
    {!tutor && b.status==='COMPLETED' && !reviewed && <details><summary className="cursor-pointer font-semibold">Review lesson</summary>
      <form className="mt-2 space-y-2" onSubmit={async e=>{
        e.preventDefault();setBusy(true)
        try{await api.post(`/bookings/${b.id}/review`,{stars,comment});setReviewed(true);setStatus('Review published.')}
        catch(err){setStatus(apiErrorMessage(err,'Could not publish review.'))}finally{setBusy(false)}
      }}><label>Rating <select value={stars} onChange={e=>setStars(Number(e.target.value))}>{[5,4,3,2,1].map(s=><option key={s} value={s}>{s}/5</option>)}</select></label>
      <Input label="How was your lesson?" maxLength={1200} required value={comment} onChange={e=>setComment(e.target.value)}/>
      <Button disabled={busy} type="submit">Publish review</Button></form></details>}
    {status && <p role="status">{status}</p>}
  </div>
}
