import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Badge, { type BadgeTone } from '../components/Badge'
import Button from '../components/Button'
import Card from '../components/Card'
import PickerField from '../components/PickerField'
import Screen from '../components/Screen'
import StatCard from '../components/StatCard'
import TextField from '../components/TextField'
import { api } from '../api/client'
import { useAuth } from '../lib/AuthContext'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import { MODE_PAIEMENT_LABELS, type Boutique, type DemandeCredit, type LigneDetteClient, type ModePaiement, type MonCredit, type StatutDemandeCredit } from '../types'

const STATUT_DETTE_LABELS: Record<string, string> = { en_cours: 'En cours', reglee: 'Réglée', en_retard: 'En retard' }
const STATUT_DETTE_TONE: Record<string, BadgeTone> = { en_cours: 'info', reglee: 'success', en_retard: 'danger' }
const STATUT_DEMANDE_LABELS: Record<StatutDemandeCredit, string> = { en_attente: 'En attente', validee: 'Validée', refusee: 'Refusée' }
const STATUT_DEMANDE_LABELS_ENSEIGNANT: Record<StatutDemandeCredit, string> = { en_attente: 'En attente de vos garants', validee: 'Validée', refusee: 'Refusée' }
const STATUT_DEMANDE_TONE: Record<StatutDemandeCredit, BadgeTone> = { en_attente: 'warning', validee: 'success', refusee: 'danger' }

const MODES_REMBOURSEMENT: { value: ModePaiement; label: string }[] = [
  { value: 'especes', label: MODE_PAIEMENT_LABELS.especes },
  { value: 'virement', label: MODE_PAIEMENT_LABELS.virement },
]

export default function CreditScreen() {
  const navigation = useNavigation<{ goBack: () => void }>()
  const { client } = useAuth()
  const [monCredit, setMonCredit] = useState<MonCredit | null>(null)
  const [demandes, setDemandes] = useState<DemandeCredit[]>([])
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [demandeOuverte, setDemandeOuverte] = useState(false)
  const [montantSouhaite, setMontantSouhaite] = useState('')
  const [motif, setMotif] = useState('')
  const [demandeBoutiqueId, setDemandeBoutiqueId] = useState('')
  const [envoiDemande, setEnvoiDemande] = useState(false)
  const [erreurDemande, setErreurDemande] = useState<string | null>(null)

  const [detteSelectionnee, setDetteSelectionnee] = useState<LigneDetteClient | null>(null)
  const [montantRemb, setMontantRemb] = useState('')
  const [modeRemb, setModeRemb] = useState<ModePaiement>('especes')
  const [envoiRemb, setEnvoiRemb] = useState(false)
  const [erreurRemb, setErreurRemb] = useState<string | null>(null)

  const refresh = useCallback(() => {
    if (!client?.credit_autorise) return
    setLoading(true)
    Promise.all([api.monCredit(), api.mesDemandesCredit(), api.boutiques()])
      .then(([mc, d, b]) => {
        setMonCredit(mc)
        setDemandes(d)
        setBoutiques(b)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error && e.message ? e.message : 'Échec du chargement.'))
      .finally(() => setLoading(false))
  }, [client?.credit_autorise])

  useEffect(refresh, [refresh])

  async function handleDemande() {
    const montant = Number(montantSouhaite)
    if (!demandeBoutiqueId || !montant || montant <= 0 || !motif.trim()) {
      setErreurDemande('Renseignez la boutique, un montant positif et un motif.')
      return
    }
    setEnvoiDemande(true)
    setErreurDemande(null)
    try {
      await api.demanderCredit({ boutique_id: demandeBoutiqueId, montant_souhaite: montant, motif: motif.trim() })
      setDemandeOuverte(false)
      setMontantSouhaite('')
      setMotif('')
      refresh()
      Alert.alert('Demande envoyée', 'Votre demande de crédit a été transmise à la boutique pour validation.')
    } catch (e) {
      setErreurDemande(e instanceof Error && e.message ? e.message : "Échec de l'envoi de la demande.")
    } finally {
      setEnvoiDemande(false)
    }
  }

  async function handleNotifierRemboursement() {
    if (!detteSelectionnee) return
    const montant = Number(montantRemb)
    if (!montant || montant <= 0) {
      setErreurRemb('Renseignez un montant positif.')
      return
    }
    setEnvoiRemb(true)
    setErreurRemb(null)
    try {
      await api.notifierRemboursement({ dette_id: detteSelectionnee.id, montant, mode_paiement: modeRemb })
      setDetteSelectionnee(null)
      setMontantRemb('')
      Alert.alert('Boutique prévenue', 'La boutique va vérifier et enregistrer votre remboursement.')
    } catch (e) {
      setErreurRemb(e instanceof Error && e.message ? e.message : "Échec de l'envoi.")
    } finally {
      setEnvoiRemb(false)
    }
  }

  return (
    <Screen title="Mon crédit" showHeader={false} onRefresh={client?.credit_autorise ? refresh : undefined} refreshing={loading} error={error}>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.teal} />
        <Text style={styles.backRowText}>Retour</Text>
      </Pressable>

      {!client?.credit_autorise ? (
        <Card>
          <Ionicons name="lock-closed-outline" size={28} color={colors.inkMuted} />
          <Text style={styles.nonActifTitle}>Crédit non activé</Text>
          <Text style={styles.nonActifText}>
            Le crédit n'est pas encore activé sur votre compte. Rendez-vous dans l'une de nos boutiques pour l'activer.
          </Text>
        </Card>
      ) : (
        <>
          <View style={styles.statRow}>
            <StatCard label="Solde restant dû" value={formatGNF(monCredit?.solde_total ?? 0)} icon="card" color={colors.danger} />
            {monCredit?.enseignant && (
              <StatCard label="Plafond disponible" value={formatGNF(monCredit.enseignant.plafond_disponible)} icon="school-outline" color={colors.teal} />
            )}
          </View>

          {monCredit?.enseignant && (
            <Text style={styles.ecoleText}>École : {monCredit.enseignant.ecole_nom}</Text>
          )}

          {monCredit?.enseignant?.plafond_suspendu && (
            <Card style={styles.attenteCard}>
              <Text style={styles.attenteText}>
                Votre plafond de crédit est suspendu suite à un impayé. Réglez votre créance en cours pour le réactiver.
              </Text>
            </Card>
          )}

          <Text style={styles.sectionTitle}>Créances en cours</Text>
          {(monCredit?.dettes ?? []).length === 0 && <Text style={styles.empty}>Aucune créance en cours.</Text>}
          {monCredit?.dettes.map((d) => (
            <Card key={d.id} style={styles.detteCard}>
              <View style={styles.detteTop}>
                <Text style={styles.detteMontant}>{formatGNF(d.solde_restant)}</Text>
                <Badge label={STATUT_DETTE_LABELS[d.statut] ?? d.statut} tone={STATUT_DETTE_TONE[d.statut] ?? 'default'} />
              </View>
              <Text style={styles.detteEcheance}>Échéance : {new Date(d.echeance).toLocaleDateString('fr-FR')}</Text>
              <Button label="Signaler un remboursement" variant="outline" onPress={() => { setDetteSelectionnee(d); setMontantRemb(''); setErreurRemb(null) }} />
            </Card>
          ))}

          <Text style={styles.sectionTitle}>Historique des remboursements</Text>
          {(monCredit?.remboursements ?? []).length === 0 && <Text style={styles.empty}>Aucun remboursement enregistré.</Text>}
          {monCredit?.remboursements.map((r) => (
            <View key={r.id} style={styles.rembRow}>
              <Text style={styles.rembDate}>{new Date(r.date).toLocaleDateString('fr-FR')}</Text>
              <Text style={styles.rembMontant}>{formatGNF(r.montant)}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Mes demandes de crédit</Text>
          {demandes.length === 0 && <Text style={styles.empty}>Aucune demande envoyée.</Text>}
          {demandes.map((d) => (
            <View key={d.id} style={styles.demandeRow}>
              <View>
                <Text style={styles.demandeMontant}>{formatGNF(d.montant_souhaite)}</Text>
                <Text style={styles.demandeMotif} numberOfLines={1}>{d.motif}</Text>
              </View>
              <Badge
                label={(monCredit?.enseignant ? STATUT_DEMANDE_LABELS_ENSEIGNANT : STATUT_DEMANDE_LABELS)[d.statut]}
                tone={STATUT_DEMANDE_TONE[d.statut]}
              />
            </View>
          ))}

          {monCredit?.enseignant?.plafond_suspendu ? (
            <Text style={styles.empty}>Nouvelle demande indisponible tant que votre plafond est suspendu.</Text>
          ) : (
            <Button label="Nouvelle demande de crédit" icon="add-circle-outline" onPress={() => setDemandeOuverte(true)} />
          )}
        </>
      )}

      <Modal visible={demandeOuverte} transparent animationType="slide" onRequestClose={() => setDemandeOuverte(false)}>
        <Pressable style={styles.backdrop} onPress={() => setDemandeOuverte(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Demande de crédit</Text>
              <PickerField
                label="Boutique"
                value={demandeBoutiqueId}
                onChange={setDemandeBoutiqueId}
                options={boutiques.map((b) => ({ value: b.id, label: b.nom }))}
                placeholder="Choisir une boutique"
              />
              <TextField label="Montant souhaité (GNF)" value={montantSouhaite} onChangeText={setMontantSouhaite} keyboardType="numeric" placeholder="100000" />
              <TextField label="Motif" value={motif} onChangeText={setMotif} placeholder="Ex. achat électroménager" />
              {erreurDemande && <Text style={styles.error}>{erreurDemande}</Text>}
              <View style={styles.sheetActions}>
                <View style={{ flex: 1 }}>
                  <Button label="Annuler" variant="outline" onPress={() => setDemandeOuverte(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Envoyer" onPress={handleDemande} loading={envoiDemande} />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!detteSelectionnee} transparent animationType="slide" onRequestClose={() => setDetteSelectionnee(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDetteSelectionnee(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.sheetTitle}>Signaler un remboursement</Text>
              <Text style={styles.sheetSubtitle}>La boutique vérifiera et enregistrera l'encaissement réel avant qu'il ne soit pris en compte.</Text>
              <TextField label="Montant versé (GNF)" value={montantRemb} onChangeText={setMontantRemb} keyboardType="numeric" placeholder="50000" />
              <PickerField label="Mode de paiement" value={modeRemb} onChange={(v) => setModeRemb(v as ModePaiement)} options={MODES_REMBOURSEMENT} searchable={false} />
              {erreurRemb && <Text style={styles.error}>{erreurRemb}</Text>}
              <View style={styles.sheetActions}>
                <View style={{ flex: 1 }}>
                  <Button label="Annuler" variant="outline" onPress={() => setDetteSelectionnee(null)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Envoyer" onPress={handleNotifierRemboursement} loading={envoiRemb} />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backRowText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  nonActifTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: spacing.sm },
  nonActifText: { fontSize: 13, color: colors.inkMuted, marginTop: 4, lineHeight: 18 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ecoleText: { fontSize: 12.5, color: colors.inkMuted },
  attenteCard: { backgroundColor: colors.warningBg, borderColor: colors.warning },
  attenteText: { fontSize: 12.5, color: colors.warning },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.inkMuted2, marginTop: spacing.sm },
  empty: { fontSize: 13, color: colors.inkMuted },
  detteCard: { gap: spacing.sm },
  detteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detteMontant: { fontSize: 17, fontWeight: '800', color: colors.danger },
  detteEcheance: { fontSize: 12.5, color: colors.inkMuted },
  rembRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.sm },
  rembDate: { fontSize: 12.5, color: colors.inkMuted },
  rembMontant: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  demandeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.sm },
  demandeMontant: { fontSize: 13.5, fontWeight: '700', color: colors.ink },
  demandeMotif: { fontSize: 11.5, color: colors.inkMuted, maxWidth: 200 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  sheetContent: { padding: spacing.lg, gap: spacing.sm },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sheetSubtitle: { fontSize: 12, color: colors.inkMuted, lineHeight: 17 },
  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  error: { color: colors.danger, fontSize: 12.5 },
})
