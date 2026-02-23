import { Navigate, useLocation } from 'react-router-dom'
import { sanitizeReturnTo } from '../../../utils/sanitizeReturnTo'

export default function LoginPage() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const returnTo = sanitizeReturnTo(params.get('returnTo'))
  const target = new URLSearchParams()
  target.set('tab', 'signin')
  target.set('returnTo', returnTo)
  return <Navigate to={`/?${target.toString()}`} replace />
}
