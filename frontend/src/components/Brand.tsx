import { Link } from 'react-router-dom'

export function Brand() {
  return <Link to="/" className="brand" aria-label="SkillBook home">
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
      <path d="M2 5q8-1 13 4v19q-5-5-13-4zM17 9q5-5 13-4v19q-8-1-13 4z" />
    </svg>SkillBook
  </Link>
}
