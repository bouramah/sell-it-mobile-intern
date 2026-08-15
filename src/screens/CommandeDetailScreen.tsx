import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import Badge, { type BadgeTone } from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import Screen from '../components/Screen'
import { api } from '../api/client'
import { imprimerOuPartagerFacture } from '../lib/documents'
import { formatGNF } from '../lib/format'
import { colors, spacing } from '../lib/theme'
import { STATUT_COMMANDE_LABELS, type CommandeClientDetail, type StatutCommandeClient } from '../types'

const STATUT_TONE: Record<StatutCommandeClient, BadgeTone> = {
  en_attente: 'warning',
  confirmee: 'info',
  en_preparation: 'info',
  en_livraison: 'info',
  livree: 'success',
  annulee: 'danger',
}

const ETAPES: StatutCommandeClient[] = ['confirmee', 'en_preparation', 'en_livraison', 'livree']

export default function CommandeDetailScreen() {
  const navigation = useNavigation<{ goBack: () => void }>()
  const route = useRoute<any>()
  const [commande, setCommande] = useState<CommandeClientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impression, setImpression] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)
    api.maCommande(route.params.commandeId).then(setCommande).catch((e) => setError(e instanceof Error && e.message ? e.message : 'Échec du chargement.')).finally(() => setLoading(false))
  }, [route.params.commandeId])

  useEffect(refresh, [refresh])

  async function handleFacture() {
    setImpression(true)
    try {
      await imprimerOuPartagerFacture(route.params.commandeId)
    } catch (e) {
      Alert.alert('Échec', e instanceof Error && e.message ? e.message : "Impossible d'ouvrir la facture.")
    } finally {
      setImpression(false)
    }
  }

  return (
    <Screen title="Commande" showHeader={false} onRefresh={refresh} refreshing={loading} error={error}>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.teal} />
        <Text style={styles.backRowText}>Retour</Text>
      </Pressable>

      {commande && (
        <>
          <Card>
            <View style={styles.top}>
              <Text style={styles.id}>Commande #{commande.id}</Text>
              <Badge label={STATUT_COMMANDE_LABELS[commande.statut]} tone={STATUT_TONE[commande.statut]} />
            </View>
            <Text style={styles.date}>{new Date(commande.date_creation).toLocaleString('fr-FR')}</Text>

            {commande.statut !== 'annulee' && (
              <View style={styles.timeline}>
                {ETAPES.map((etape, i) => {
                  const indexActuel = ETAPES.indexOf(commande.statut)
                  const atteint = indexActuel >= 0 && i <= indexActuel
                  return (
                    <View key={etape} style={styles.etape}>
                      <View style={[styles.etapePoint, atteint && styles.etapePointActif]} />
                      <Text style={[styles.etapeLabel, atteint && styles.etapeLabelActif]}>{STATUT_COMMANDE_LABELS[etape]}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Articles</Text>
            {commande.articles.map((a) => (
              <View key={a.id} style={styles.article}>
                <Text style={styles.articleNom} numberOfLines={1}>{a.produit_nom} × {a.quantite}</Text>
                <Text style={styles.articlePrix}>{formatGNF(a.prix_unitaire * a.quantite)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatGNF(commande.montant)}</Text>
            </View>
          </Card>

          {commande.remise_statut === 'en_attente' && (
            <Card style={styles.attenteCard}>
              <Text style={styles.attenteText}>
                Une remise sur cette commande est en attente de validation par la boutique — elle sera confirmée sous peu.
              </Text>
            </Card>
          )}

          <Button label="Télécharger la facture" icon="document-text-outline" variant="outline" onPress={handleFacture} loading={impression} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backRowText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { fontSize: 16, fontWeight: '700', color: colors.ink },
  date: { fontSize: 12.5, color: colors.inkMuted, marginTop: 2 },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  etape: { alignItems: 'center', gap: 4, flex: 1 },
  etapePoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cardBorder },
  etapePointActif: { backgroundColor: colors.teal },
  etapeLabel: { fontSize: 9.5, color: colors.inkMuted, textAlign: 'center' },
  etapeLabelActif: { color: colors.tealDark, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.inkMuted2, marginBottom: spacing.sm },
  article: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  articleNom: { fontSize: 13.5, color: colors.ink, flex: 1, marginRight: spacing.sm },
  articlePrix: { fontSize: 13.5, color: colors.inkMuted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  totalLabel: { fontSize: 13, color: colors.inkMuted },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.tealDark },
  attenteCard: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  attenteText: { fontSize: 12.5, color: colors.warning },
})
