import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler } from '../api/client'
import { clearToken, getToken, setToken } from './auth'
import type { Client } from '../types'

interface AuthContextValue {
  client: Client | null
  loading: boolean
  demanderCode: (contact: string) => Promise<void>
  verifierCode: (contact: string, code: string) => Promise<{ nouveauCompte: boolean }>
  refreshProfil: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUnauthorizedHandler(() => setClient(null))
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) return
        setClient(await api.moi())
      } catch {
        await clearToken().catch(() => {})
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function demanderCode(contact: string) {
    await api.demanderCode({ contact })
  }

  async function verifierCode(contact: string, code: string) {
    const { access_token, nouveau_compte } = await api.verifierCode({ contact, code })
    await setToken(access_token)
    setClient(await api.moi())
    return { nouveauCompte: nouveau_compte }
  }

  async function refreshProfil() {
    setClient(await api.moi())
  }

  async function logout() {
    await clearToken()
    setClient(null)
  }

  return (
    <AuthContext.Provider value={{ client, loading, demanderCode, verifierCode, refreshProfil, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
