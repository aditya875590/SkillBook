import { useEffect,useState } from 'react'
import api from '../services/api'

export function TutorExtras({id,video}:{id:string;video?:string}) {
  const [reviews,setReviews]=useState<{stars:number;comment:string}[]>([])
  const [error,setError]=useState(false)
  useEffect(()=>{let active=true;api.get(`/tutors/${id}/reviews`).then(({data})=>{
    if(active){setReviews(data.data);setError(false)}
  }).catch(()=>{if(active)setError(true)});return()=>{active=false}},[id])
  let youtube=''
  if(video){
    const url=new URL(video)
    const key=url.hostname==='youtu.be'?url.pathname.slice(1):['www.youtube.com','youtube.com','m.youtube.com'].includes(url.hostname)?url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]:''
    if(key && /^[\w-]{11}$/.test(key))youtube=`https://www.youtube-nocookie.com/embed/${key}`
  }
  return <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface p-6">
    {video && <section><h2 className="mb-2 font-semibold">Meet your tutor</h2>
      {youtube?<iframe className="aspect-video w-full rounded-lg" title="Tutor introduction" src={youtube} allowFullScreen/>:
      <video className="w-full rounded-lg" controls preload="metadata" src={video}/>}
      <a className="underline" href={video} target="_blank" rel="noreferrer">Open introduction video ↗</a></section>}
    <h2 className="font-semibold">Student reviews</h2>
    {error?<p>Reviews could not load.</p>:reviews.length?reviews.map((r,i)=><blockquote key={i}><b>{r.stars}/5</b> · {r.comment}</blockquote>):<p>No reviews yet.</p>}
  </div>
}
