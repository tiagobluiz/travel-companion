import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import LoginPage from './LoginPage'

function RedirectTargetProbe() {
  const location = useLocation()
  return <div>{`${location.pathname}${location.search}`}</div>
}

function renderLogin(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RedirectTargetProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('redirects to discovery shell sign-in tab', () => {
    renderLogin()
    expect(screen.getByText('/?tab=signin&returnTo=%2F')).toBeInTheDocument()
  })

  it('preserves returnTo query param when redirecting to shell', () => {
    renderLogin('/login?returnTo=%2Ftrips%2Ftrip-1')
    expect(screen.getByText('/?tab=signin&returnTo=%2Ftrips%2Ftrip-1')).toBeInTheDocument()
  })
})
