import { Navigate, useLocation } from 'react-router-dom'

export default function LoginPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = params.get('returnTo')
  const target = new URLSearchParams()
  target.set('tab', 'signin')
  if (returnTo) target.set('returnTo', returnTo)
  return <Navigate to={`/?${target.toString()}`} replace />
}
