const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function api(path, options = {}) {
  const headers = new Headers(options.headers)
  const token = localStorage.getItem('library-token')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new Error('Не вдалося зв’язатися із сервером. Перевірте, чи запущений API.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.message || 'Не вдалося виконати запит.')
    error.status = response.status
    throw error
  }
  return payload
}
