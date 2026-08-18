import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import Button from '../components/Button'
import Card from '../components/Card'
import ListRow from '../components/ListRow'
import RequireAuth from '../components/RequireAuth'
import Screen from '../components/Screen'
import TextField from '../components/TextField'
import { api } from '../api/client'
import { useAuth } from '../lib/AuthContext'
import { colors, spacing } from '../lib/theme'

function initiales(nom: string) {
  const parts = nom.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}

function CompteContenu() {
  const { client, refreshProfil, logout } = useAuth()
  const navigation = useNavigation<{ navigate: (screen: string) => void }>()
  const [editing, setEditing] = useState(false)
  const [nom, setNom] = useState(client?.nom ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le profil (dont credit_autorise, lu par CreditScreen) n'est sinon chargé qu'une fois au
  // lancement de l'appli — sans ça, une activation de crédit côté staff resterait invisible
  // jusqu'à une reconnexion.
  useFocusEffect(
    useCallback(() => {
      refreshProfil()
    }, [refreshProfil])
  )

  async function handleEnregistrer() {
    if (!nom.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.modifierProfil({ nom: nom.trim() })
      await refreshProfil()
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Échec de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  function confirmerDeconnexion() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => logout() },
    ])
  }

  if (!client) return null

  return (
    <Screen title="Mon compte">
      <Card style={styles.profilCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiales(client.nom)}</Text>
        </View>
        {!editing ? (
          <View style={styles.profilInfo}>
            <Text style={styles.nom}>{client.nom}</Text>
            <Text style={styles.contact}>{client.contact}</Text>
            <Button label="Modifier mon nom" variant="outline" onPress={() => { setNom(client.nom); setEditing(true) }} />
          </View>
        ) : (
          <View style={styles.editForm}>
            <TextField label="Nom complet" value={nom} onChangeText={setNom} placeholder="Votre nom" />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.editActions}>
              <View style={{ flex: 1 }}>
                <Button label="Annuler" variant="outline" onPress={() => { setEditing(false); setError(null) }} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Enregistrer" onPress={handleEnregistrer} loading={saving} />
              </View>
            </View>
          </View>
        )}
      </Card>

      <ListRow
        title="Mon crédit"
        subtitle={client.credit_autorise ? 'Solde, échéances et demandes' : "Non activé — rendez-vous en boutique"}
        icon="card-outline"
        onPress={() => navigation.navigate('Credit')}
      />
      <ListRow
        title="Assistant IA"
        subtitle="Posez une question sur vos commandes ou votre crédit"
        icon="chatbubbles-outline"
        onPress={() => navigation.navigate('Assistant')}
      />
      <ListRow title="Déconnexion" subtitle="Se déconnecter de l'appli" icon="log-out-outline" onPress={confirmerDeconnexion} danger />
    </Screen>
  )
}

export default function CompteScreen() {
  return (
    <RequireAuth>
      <CompteContenu />
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  profilCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.tealLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.tealDark, fontSize: 18, fontWeight: '700' },
  profilInfo: { flex: 1, gap: spacing.xs },
  nom: { fontSize: 17, fontWeight: '800', color: colors.ink },
  contact: { fontSize: 13, color: colors.inkMuted, marginBottom: 4 },
  editForm: { flex: 1, gap: spacing.sm },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  error: { color: colors.danger, fontSize: 12.5 },
})
