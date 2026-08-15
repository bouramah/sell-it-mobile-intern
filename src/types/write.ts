import type { ModePaiement, PalierPrix } from './index'

export interface DemanderCodeRequest {
  contact: string
}

export interface VerifierCodeRequest {
  contact: string
  code: string
}

export interface ClientTokenResponse {
  access_token: string
  token_type: string
  nouveau_compte: boolean
}

export interface ClientProfilUpdate {
  nom: string
  quartier?: string | null
  commune?: string | null
  ville?: string | null
  secteur_geo_id?: string | null
}

export interface ArticleCommandeInput {
  produit_id: string
  quantite: number
  palier?: PalierPrix
  prix_unitaire?: number | null
}

export interface MaCommandeCreate {
  boutique_id: string
  mode_paiement: ModePaiement
  articles: ArticleCommandeInput[]
}

export interface DemandeCreditCreate {
  boutique_id: string
  montant_souhaite: number
  motif: string
}

export interface NotifierRemboursementRequest {
  dette_id: string
  montant: number
  mode_paiement: ModePaiement
  note?: string | null
}
