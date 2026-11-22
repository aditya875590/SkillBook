import { useState } from 'react'
import api from '../../services/api'
interface AvatarProps {
  userId?: string
  version?: number
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
}

function Avatar({ name, size = 'md', userId, version=0 }: AvatarProps) {
  const src = userId ? api.getUri({url:`/people/${userId}/photo`,params:{v:version}}) : ''
  const [failed,setFailed] = useState('')
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src && failed !== src) return <img src={src} alt={name} loading="lazy" onError={() => setFailed(src)}
    className={`shrink-0 rounded-full object-cover ${sizeClasses[size]}`} />
  return (
    <div
      role="img"
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-text-on-primary ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  )
}

export default Avatar
export { Avatar }
