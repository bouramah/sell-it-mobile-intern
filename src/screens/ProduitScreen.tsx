import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Badge from '../components/Badge'
import Button from '../components/Button'
import PickerField from '../components/PickerField'
import Screen from '../components/Screen'
import { api } from '../api/client'
import { useCart } from '../lib/CartContext'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import type { Boutique, ProduitCatalogue } from '../types'

const SECTEUR_LABELS: Record<string, string> = {
  alimentation_generale: 'Alimentation générale',
  habillement: 'Habillement',
  electronique_electromenager: 'Électronique / Électroménager',
}

export default function ProduitScreen() {
  const navigation = useNavigation<{ goBack: () => void }>()
  const route = useRoute<any>()
  const produit = route.params.produit as ProduitCatalogue
  const { boutiqueId, boutiqueNom, choisirBoutique, ajouter } = useCart()

  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [ajoute, setAjoute] = useState(false)

  useEffect(() => {
    api.boutiques().then((liste) => setBoutiques(liste.filter((b) => produit.boutiques_disponibles.includes(b.id)))).catch(() => {})
  }, [produit.boutiques_disponibles])

  const boutiqueValide = boutiqueId && produit.boutiques_disponibles.includes(boutiqueId)

  function handleAjouter() {
    ajouter(produit)
    setAjoute(true)
    setTimeout(() => setAjoute(false), 1500)
  }

  return (
    <Screen title="Produit" showHeader={false} footer={
      boutiqueValide ? (
        <Button label={ajoute ? 'Ajouté au panier ✓' : 'Ajouter au panier'} icon={ajoute ? 'checkmark' : 'cart'} onPress={handleAjouter} disabled={produit.disponible === 0} />
      ) : undefined
    }>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.teal} />
        <Text style={styles.backRowText}>Retour au catalogue</Text>
      </Pressable>

      {produit.images[0] ? (
        <Image source={{ uri: produit.images[0] }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={48} color={colors.inkMuted} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.nom}>{produit.nom}</Text>
        <Text style={styles.categorie}>{SECTEUR_LABELS[produit.secteur] ?? produit.secteur} · {produit.categorie}</Text>
        <Text style={styles.prix}>{formatGNF(produit.prix_detail)} <Text style={styles.unite}>/ {produit.unite}</Text></Text>

        {produit.disponible > 0 ? (
          <Badge label="En stock" tone="success" />
        ) : (
          <Badge label="Rupture de stock" tone="danger" />
        )}

        {(produit.prix_semi_gros !== produit.prix_detail || produit.prix_gros !== produit.prix_detail) && (
          <View style={styles.paliers}>
            <Text style={styles.palierLigne}>Semi-gros : {formatGNF(produit.prix_semi_gros)}</Text>
            <Text style={styles.palierLigne}>Gros : {formatGNF(produit.prix_gros)}</Text>
          </View>
        )}
      </View>

      <View style={styles.boutiqueBloc}>
        <Text style={styles.boutiqueLabel}>Boutique pour cet achat</Text>
        <PickerField
          label=""
          value={boutiqueId ?? ''}
          onChange={(id) => {
            const b = boutiques.find((x) => x.id === id)
            if (b) choisirBoutique(b.id, b.nom)
          }}
          options={boutiques.map((b) => ({ value: b.id, label: `${b.nom} — ${b.quartier}, ${b.ville}` }))}
          placeholder="Choisir une boutique disponible"
        />
        {boutiqueId && !boutiqueValide && (
          <Text style={styles.attention}>Ce produit n'est pas disponible dans {boutiqueNom} — choisissez une autre boutique.</Text>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backRowText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  image: { width: '100%', height: 220, borderRadius: radius.card, backgroundColor: colors.page },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { gap: spacing.xs },
  nom: { fontSize: 19, fontWeight: '800', color: colors.ink },
  categorie: { fontSize: 13, color: colors.inkMuted },
  prix: { fontSize: 22, fontWeight: '800', color: colors.tealDark, marginTop: 4 },
  unite: { fontSize: 13, fontWeight: '400', color: colors.inkMuted },
  paliers: { marginTop: spacing.xs, gap: 2 },
  palierLigne: { fontSize: 12.5, color: colors.inkMuted },
  boutiqueBloc: { gap: spacing.xs, marginTop: spacing.sm },
  boutiqueLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted2 },
  attention: { fontSize: 12, color: colors.warning },
})
