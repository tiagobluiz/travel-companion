import { Navigate, useLocation } from 'react-router-dom'

export default function RegisterPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = params.get('returnTo')
  const target = new URLSearchParams()
  target.set('tab', 'signup')
  if (returnTo) target.set('returnTo', returnTo)
  return <Navigate to={`/?${target.toString()}`} replace />
}
