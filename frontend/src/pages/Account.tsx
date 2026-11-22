import { useEffect,useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { GoogleButton } from '../components/GoogleButton'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { apiErrorMessage,getStoredUser } from '../services/auth'
import api from '../services/api'
import { fetchOwnProfile } from '../services/tutors'

async function makePhoto(file:File) {
  if (!file.type.startsWith('image/') || file.size>12_000_000) throw new Error('Choose a photo smaller than 12 MB')
  const img=await createImageBitmap(file)
  try {
    const size=Math.min(img.width,img.height)
    const canvas=document.createElement('canvas');canvas.width=canvas.height=Math.min(size,600)
    const ctx=canvas.getContext('2d')!
    ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(img,(img.width-size)/2,(img.height-size)/2,size,size,0,0,canvas.width,canvas.height)
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not read image')),'image/jpeg',0.85))
  } finally {img.close()}
}

export default function Account() {
  const user=getStoredUser(), role=user?.role
  const [version,update]=useState(0),[video,setVideo]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false)
  useEffect(()=>{if(role==='TUTOR') fetchOwnProfile().then(p=>setVideo(p?.introVideo??'')).catch(()=>setStatus('Could not load the tutor profile.'))},[role])
  if(!user)return <Navigate to="/login" replace/>
  return <AppShell><div className="mx-auto max-w-xl"><header className="workspace-head"><p className="eyebrow">Personal settings</p><h1>My account</h1></header>
    <div className="my-4 space-y-5 rounded-xl border border-border bg-surface p-6">
      <Avatar name={user.name} userId={user.id} version={version} size="lg"/>
      <label className="block font-semibold">Profile photo<input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e=>{
        const file=e.target.files?.[0]; if(!file)return
        setBusy(true)
        try{const form=new FormData();form.append('image',await makePhoto(file),'profile.jpg')
          await api.put('/account/photo',form,{headers:{'Content-Type':'multipart/form-data'}});update(Date.now());setStatus('Photo saved.')
        }catch(err){setStatus(apiErrorMessage(err,'Could not save photo.'))}finally{setBusy(false)}
      }}/></label>
      {role==='TUTOR' && <form onSubmit={async e=>{
        e.preventDefault();setBusy(true)
        try{await api.put('/account/intro-video',{url:video});setStatus('Intro video saved.')}catch(err){setStatus(apiErrorMessage(err,'Could not save video.'))}finally{setBusy(false)}
      }}><Input label="Tutor introduction video URL" value={video} type="url" onChange={e=>setVideo(e.target.value)} hint="Use a public YouTube or HTTPS video link. Leave blank to remove."/><Button className="mt-3" type="submit" disabled={busy}>Save video</Button></form>}
      <GoogleButton link done={()=>setStatus('Google account connected.')}/>
      <p aria-live="polite">{status}</p>
    </div></div></AppShell>
}
