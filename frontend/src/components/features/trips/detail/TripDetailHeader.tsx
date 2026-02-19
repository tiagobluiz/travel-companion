import { Link } from 'react-router-dom'

interface TripDetailHeaderProps {
  tripName: string
  userDisplayName: string
  isAuthenticated: boolean
  onLogout: () => void
}

export function TripDetailHeader({
  tripName,
  userDisplayName,
  isAuthenticated,
  onLogout,
}: TripDetailHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-primary-600 hover:underline">
            {'<-'} Back
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{tripName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{userDisplayName}</span>
          {isAuthenticated && (
            <button onClick={onLogout} className="text-sm text-primary-600 hover:underline">
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
