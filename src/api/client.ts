import { clearToken, getToken } from '../lib/auth'
import type { Boutique, Client, CommandeClient, CommandeClientDetail, DemandeCredit, MonCredit, ProduitCatalogue } from '../types'
import type {
  ClientProfilUpdate,
  ClientTokenResponse,
  DemanderCodeRequest,
  DemandeCreditCreate,
  MaCommandeCreate,
  NotifierRemboursementRequest,
  VerifierCodeRequest,
} from '../types/write'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1'
const SERVER_BASE = API_BASE.replace(/\/api\/v1\/?$/, '')

// Le backend renvoie soit une URL absolue (fixtures de démo), soit un chemin relatif
// /uploads/... (upload réel via l'appli web) — même logique de résolution que
// web/src/pages/Catalogue.tsx (SERVER_BASE + chemin) pour rester cohérent entre canaux.
export function resolveImageUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${SERVER_BASE}${url}`
}

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Distingue ce canal (appli mobile client / grand public) dans le journal d'audit.
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken()
  return { 'X-Client-Canal': 'mobile_client', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

// FastAPI renvoie `detail` en string pour les erreurs métier (400/403/404/409…) mais en
// tableau d'objets {msg, loc, type} pour les erreurs de validation (422).
function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e === 'object' && 'msg' in e ? String((e as { msg: unknown }).msg) : JSON.stringify(e)))
      .join(' ; ')
  }
  return ''
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

async function handle<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = formatDetail(body.detail)
    } catch {
      // ignore
    }
    if (res.status === 401) {
      await clearToken().catch(() => {})
      onUnauthorized?.()
    }
    throw new ApiError(res.status, detail || `Erreur API ${res.status} sur ${path}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// URLSearchParams stringifie `undefined` en la chaîne littérale "undefined" — sans ce filtre,
// un paramètre optionnel omis (ex. boutique_id non choisi) serait envoyé comme
// "?boutique_id=undefined", que le backend traite comme un vrai identifiant invalide.
function buildQuery(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter((e): e is [string, string] => !!e[1])
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries).toString()}`
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await authHeaders() })
  return handle<T>(res, path)
}

async function sendJson<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handle<T>(res, path)
}

export const api = {
  demanderCode: (payload: DemanderCodeRequest) => sendJson<{ message: string }>('POST', '/client-auth/demander-code', payload),
  verifierCode: (payload: VerifierCodeRequest) => sendJson<ClientTokenResponse>('POST', '/client-auth/verifier-code', payload),
  moi: () => getJson<Client>('/client-auth/moi'),
  modifierProfil: (payload: ClientProfilUpdate) => sendJson<Client>('PUT', '/client-auth/moi', payload),

  boutiques: (params?: { ville?: string; commune?: string; secteur?: string }) => {
    const qs = buildQuery(params)
    return getJson<Boutique[]>(`/catalogue/boutiques${qs}`)
  },
  produits: (params?: { boutique_id?: string; secteur?: string; categorie?: string; q?: string }) => {
    const qs = buildQuery(params)
    return getJson<ProduitCatalogue[]>(`/catalogue/produits${qs}`)
  },

  mesCommandes: () => getJson<CommandeClient[]>('/mes-commandes'),
  maCommande: (id: string) => getJson<CommandeClientDetail>(`/mes-commandes/${id}`),
  creerMaCommande: (payload: MaCommandeCreate) => sendJson<CommandeClientDetail>('POST', '/mes-commandes', payload),

  monCredit: () => getJson<MonCredit>('/mon-credit'),
  mesDemandesCredit: () => getJson<DemandeCredit[]>('/mon-credit/demandes'),
  demanderCredit: (payload: DemandeCreditCreate) => sendJson<DemandeCredit>('POST', '/mon-credit/demandes', payload),
  notifierRemboursement: (payload: NotifierRemboursementRequest) =>
    sendJson<{ message: string }>('POST', '/mon-credit/notifier-remboursement', payload),
}

export { ApiError }
