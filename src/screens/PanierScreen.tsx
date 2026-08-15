import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import Button from '../components/Button'
import PickerField from '../components/PickerField'
import Screen from '../components/Screen'
import LoginScreen from './LoginScreen'
import { api } from '../api/client'
import { useAuth } from '../lib/AuthContext'
import { useCart } from '../lib/CartContext'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import type { ModePaiement } from '../types'

export default function PanierScreen() {
  const navigation = useNavigation<{ getParent: () => { navigate: (screen: string) => void } | undefined }>()
  const { client } = useAuth()
  const { boutiqueId, boutiqueNom, lignes, changerQuantite, retirer, vider, total, nbArticles } = useCart()
  const [modePaiement, setModePaiement] = useState<ModePaiement>('a_la_livraison')
  const [showLogin, setShowLogin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (showLogin && client) setShowLogin(false)
  }, [client, showLogin])

  function onChangeModePaiement(v: string) {
    if (v === 'mobile_money') {
      Alert.alert('Bientôt disponible', "Le paiement Mobile Money n'est pas encore disponible. Choisissez un autre mode pour le moment.")
      return
    }
    setModePaiement(v as ModePaiement)
  }

  async function handleCommander() {
    if (!client) {
      setShowLogin(true)
      return
    }
    if (!boutiqueId) {
      setError('Choisissez une boutique dans le catalogue avant de commander.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.creerMaCommande({
        boutique_id: boutiqueId,
        mode_paiement: modePaiement,
        articles: lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })),
      })
      vider()
      Alert.alert('Commande envoyée', `Votre commande a été transmise à ${boutiqueNom}. Suivez son statut dans l'onglet Commandes.`, [
        { text: 'OK', onPress: () => navigation.getParent()?.navigate('Commandes') },
      ])
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Échec de l'envoi de la commande.")
    } finally {
      setSubmitting(false)
    }
  }

  if (showLogin) return <LoginScreen />

  if (lignes.length === 0) {
    return (
      <Screen title="Panier">
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={48} color={colors.inkMuted} />
          <Text style={styles.emptyText}>Votre panier est vide.</Text>
          <Text style={styles.emptySubtext}>Parcourez le catalogue pour ajouter des articles.</Text>
        </View>
      </Screen>
    )
  }

  const MODE_OPTIONS = [
    { value: 'a_la_livraison', label: 'À la livraison' },
    { value: 'especes', label: 'Paiement en boutique' },
    ...(client?.credit_autorise ? [{ value: 'credit_client', label: 'Crédit' }] : []),
    { value: 'mobile_money', label: 'Mobile Money (bientôt)' },
  ]

  return (
    <Screen
      title="Panier"
      footer={<Button label={`Commander — ${formatGNF(total)}`} onPress={handleCommander} loading={submitting} />}
    >
      {boutiqueNom && (
        <View style={styles.boutiqueBanner}>
          <Ionicons name="storefront" size={13} color={colors.tealDark} />
          <Text style={styles.boutiqueBannerText}>{boutiqueNom}</Text>
        </View>
      )}

      {lignes.map((l) => (
        <View key={l.produit_id} style={styles.ligne}>
          <View style={styles.ligneInfo}>
            <Text style={styles.ligneNom} numberOfLines={2}>{l.produit_nom}</Text>
            <Text style={styles.lignePrix}>{formatGNF(l.prix_unitaire)}</Text>
          </View>
          <View style={styles.quantiteRow}>
            <Pressable style={styles.qteBtn} onPress={() => changerQuantite(l.produit_id, l.quantite - 1)}>
              <Ionicons name="remove" size={16} color={colors.teal} />
            </Pressable>
            <Text style={styles.qteValue}>{l.quantite}</Text>
            <Pressable style={styles.qteBtn} onPress={() => changerQuantite(l.produit_id, l.quantite + 1)} disabled={l.quantite >= l.disponible}>
              <Ionicons name="add" size={16} color={l.quantite >= l.disponible ? colors.inkMuted : colors.teal} />
            </Pressable>
            <Pressable style={styles.removeBtn} onPress={() => retirer(l.produit_id)}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </Pressable>
          </View>
        </View>
      ))}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{nbArticles} article(s)</Text>
        <Text style={styles.totalValue}>{formatGNF(total)}</Text>
      </View>

      <PickerField label="Mode de paiement" value={modePaiement} onChange={onChangeModePaiement} options={MODE_OPTIONS} searchable={false} />

      {error && <Text style={styles.error}>{error}</Text>}
    </Screen>
  )
}

const styles = StyleSheet.create({
  boutiqueBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.tealLight, borderRadius: radius.card, padding: spacing.sm },
  boutiqueBannerText: { fontSize: 12.5, color: colors.tealDark, fontWeight: '600' },
  ligne: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, gap: spacing.sm },
  ligneInfo: { gap: 2 },
  ligneNom: { fontSize: 14, fontWeight: '600', color: colors.ink },
  lignePrix: { fontSize: 13, color: colors.inkMuted },
  quantiteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qteBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  qteValue: { fontSize: 15, fontWeight: '700', color: colors.ink, minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto', padding: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLabel: { fontSize: 13, color: colors.inkMuted },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingTop: spacing.xl * 2 },
  emptyText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  emptySubtext: { fontSize: 13, color: colors.inkMuted },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
})
