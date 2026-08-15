import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ProduitCatalogue } from '../types'

export interface LigneCart {
  produit_id: string
  produit_nom: string
  prix_unitaire: number
  quantite: number
  disponible: number
}

interface CartContextValue {
  boutiqueId: string | null
  boutiqueNom: string | null
  lignes: LigneCart[]
  choisirBoutique: (id: string | null, nom: string | null) => void
  ajouter: (produit: ProduitCatalogue) => void
  changerQuantite: (produitId: string, quantite: number) => void
  retirer: (produitId: string) => void
  vider: () => void
  total: number
  nbArticles: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [boutiqueId, setBoutiqueId] = useState<string | null>(null)
  const [boutiqueNom, setBoutiqueNom] = useState<string | null>(null)
  const [lignes, setLignes] = useState<LigneCart[]>([])

  function choisirBoutique(id: string | null, nom: string | null) {
    // Changer de boutique (y compris revenir à "Toutes les boutiques", id=null) invalide le
    // panier : prix et disponibilité sont propres à chaque boutique (CDC §3.5 — "choix de la
    // boutique source"), un panier mixte n'a pas de sens.
    if (id !== boutiqueId) setLignes([])
    setBoutiqueId(id)
    setBoutiqueNom(nom)
  }

  function ajouter(produit: ProduitCatalogue) {
    setLignes((c) => {
      const existant = c.find((l) => l.produit_id === produit.id)
      if (existant) {
        const quantite = Math.min(existant.quantite + 1, produit.disponible)
        return c.map((l) => (l.produit_id === produit.id ? { ...l, quantite } : l))
      }
      return [...c, { produit_id: produit.id, produit_nom: produit.nom, prix_unitaire: produit.prix_detail, quantite: 1, disponible: produit.disponible }]
    })
  }

  function changerQuantite(produitId: string, quantite: number) {
    setLignes((c) => c.map((l) => (l.produit_id === produitId ? { ...l, quantite: Math.max(0, Math.min(quantite, l.disponible)) } : l)).filter((l) => l.quantite > 0))
  }

  function retirer(produitId: string) {
    setLignes((c) => c.filter((l) => l.produit_id !== produitId))
  }

  function vider() {
    setLignes([])
  }

  const total = useMemo(() => lignes.reduce((s, l) => s + l.prix_unitaire * l.quantite, 0), [lignes])
  const nbArticles = useMemo(() => lignes.reduce((s, l) => s + l.quantite, 0), [lignes])

  return (
    <CartContext.Provider value={{ boutiqueId, boutiqueNom, lignes, choisirBoutique, ajouter, changerQuantite, retirer, vider, total, nbArticles }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
