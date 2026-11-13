import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('library-token')))
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('library-token')) return

    api('/auth/me')
      .then(({ user: currentUser }) => {
        setUser(currentUser)
        setAuthError('')
      })
      .catch((error) => {
        if (error.status === 401) localStorage.removeItem('library-token')
        setUser(null)
        if (error.status !== 401) setAuthError(error.message)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    setAuthError('')
    const result = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('library-token', result.token)
    setUser(result.user)
  }

  async function register({ name, email, phone, password }) {
    setAuthError('')
    const result = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    })
    localStorage.setItem('library-token', result.token)
    setUser(result.user)
  }

  function logout() {
    localStorage.removeItem('library-token')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, authError, login, register, logout }),
    [user, loading, authError],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
