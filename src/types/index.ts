export type ModePaiement = 'especes' | 'mobile_money' | 'a_la_livraison' | 'credit_client' | 'virement' | 'lettre_change'
export type StatutCommandeClient = 'en_attente' | 'confirmee' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee'
export type CanalCommande = 'web' | 'mobile_client' | 'boutique'
export type PalierPrix = 'detail' | 'semi_gros' | 'gros'
export type StatutValidationRemise = 'aucune' | 'en_attente' | 'validee'
export type StatutDemandeCredit = 'en_attente' | 'validee' | 'refusee'

export const STATUT_COMMANDE_LABELS: Record<StatutCommandeClient, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Paiement en boutique',
  mobile_money: 'Mobile Money',
  a_la_livraison: 'À la livraison',
  credit_client: 'Crédit',
  virement: 'Virement',
  lettre_change: 'Lettre de change',
}

export interface Boutique {
  id: string
  nom: string
  secteurs: string[]
  quartier: string
  commune: string
  ville: string
  horaires: string
  telephone: string
  latitude: number | null
  longitude: number | null
}

export interface ProduitCatalogue {
  id: string
  nom: string
  secteur: string
  categorie: string
  unite: string
  images: string[]
  prix_detail: number
  prix_semi_gros: number
  prix_gros: number
  disponible: number
  boutiques_disponibles: string[]
}

export interface ProduitRecommande extends ProduitCatalogue {
  raison: string
}

export interface ArticleCommande {
  id: string
  produit_id: string
  produit_nom: string
  quantite: number
  palier: PalierPrix
  prix_unitaire: number
  prix_catalogue_a_la_vente: number | null
}

export interface CommandeClient {
  id: string
  client_nom: string
  client_id: string | null
  boutique_id: string
  canal: CanalCommande
  mode_paiement: ModePaiement
  montant: number
  statut: StatutCommandeClient
  date_creation: string
  remise_statut: StatutValidationRemise
  remise_motif: string | null
  remise_validee_par: string | null
  remise_validee_le: string | null
}

export interface CommandeClientDetail extends CommandeClient {
  articles: ArticleCommande[]
}

export interface Client {
  id: string
  nom: string
  contact: string
  boutique_ids: string[]
  segment: string
  credit_autorise: boolean
  solde_dette: number
  quartier: string | null
  commune: string | null
  ville: string | null
  secteur_geo_id: string | null
}

export interface LigneDetteClient {
  id: string
  boutique_id: string
  montant_initial: number
  solde_restant: number
  echeance: string
  statut: string
}

export interface Remboursement {
  id: string
  dette_id: string
  caisse_id: string | null
  montant: number
  mode_paiement: ModePaiement
  date: string
  operateur: string
}

export interface InfosEnseignant {
  ecole_nom: string
  plafond_disponible: number
  plafond_suspendu: boolean
}

export interface MonCredit {
  credit_autorise: boolean
  solde_total: number
  dettes: LigneDetteClient[]
  remboursements: Remboursement[]
  enseignant: InfosEnseignant | null
}

export interface DemandeCredit {
  id: string
  client_id: string
  client_nom: string
  boutique_id: string
  montant_souhaite: number
  motif: string
  statut: StatutDemandeCredit
  date_creation: string
}
