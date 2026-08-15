import { useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Badge, { type BadgeTone } from '../components/Badge'
import RequireAuth from '../components/RequireAuth'
import Screen from '../components/Screen'
import { api } from '../api/client'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import { STATUT_COMMANDE_LABELS, type CommandeClient, type StatutCommandeClient } from '../types'

const STATUT_TONE: Record<StatutCommandeClient, BadgeTone> = {
  en_attente: 'warning',
  confirmee: 'info',
  en_preparation: 'info',
  en_livraison: 'info',
  livree: 'success',
  annulee: 'danger',
}

function CommandesListe() {
  const navigation = useNavigation<{ navigate: (screen: string, params: unknown) => void }>()
  const [commandes, setCommandes] = useState<CommandeClient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setLoading(true)
    api.mesCommandes().then(setCommandes).catch((e) => setError(e instanceof Error && e.message ? e.message : 'Échec du chargement.')).finally(() => setLoading(false))
  }, [])

  useEffect(refresh, [refresh])

  return (
    <Screen title="Mes commandes" onRefresh={refresh} refreshing={loading} error={error}>
      {commandes.length === 0 && !loading && <Text style={styles.empty}>Vous n'avez pas encore passé de commande.</Text>}
      {commandes.map((c) => (
        <Pressable key={c.id} style={styles.card} onPress={() => navigation.navigate('CommandeDetail', { commandeId: c.id })}>
          <View style={styles.cardTop}>
            <Text style={styles.commandeId}>Commande #{c.id}</Text>
            <Badge label={STATUT_COMMANDE_LABELS[c.statut]} tone={STATUT_TONE[c.statut]} />
          </View>
          <Text style={styles.date}>{new Date(c.date_creation).toLocaleString('fr-FR')}</Text>
          <Text style={styles.montant}>{formatGNF(c.montant)}</Text>
        </Pressable>
      ))}
    </Screen>
  )
}

export default function CommandesScreen() {
  return (
    <RequireAuth>
      <CommandesListe />
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, gap: 4 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commandeId: { fontSize: 14, fontWeight: '700', color: colors.ink },
  date: { fontSize: 12, color: colors.inkMuted },
  montant: { fontSize: 16, fontWeight: '800', color: colors.tealDark, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.xl },
})
