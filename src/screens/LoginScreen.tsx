import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../lib/AuthContext'
import { colors, spacing } from '../lib/theme'

type Vue = 'contact' | 'code'

export default function LoginScreen() {
  const { demanderCode, verifierCode } = useAuth()
  const [vue, setVue] = useState<Vue>('contact')
  const [contact, setContact] = useState('')
  const [code, setCode] = useState('')
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDemanderCode() {
    if (!contact.trim()) {
      setError('Renseignez votre numéro de téléphone.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await demanderCode(contact.trim())
      setInfo('Un code de vérification vous a été envoyé par SMS.')
      setVue('code')
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Impossible d'envoyer le code pour le moment.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifierCode() {
    if (!code.trim()) {
      setError('Renseignez le code reçu par SMS.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await verifierCode(contact.trim(), code.trim())
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Image source={require('../../assets/logo.jpeg')} style={styles.logo} resizeMode="contain" />

      {vue === 'contact' && (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenue chez KFSTORE</Text>
            <Text style={styles.subtitle}>Connectez-vous avec votre numéro de téléphone — aucun mot de passe requis.</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Numéro de téléphone"
              value={contact}
              onChangeText={setContact}
              placeholder="620 00 00 00"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button label="Recevoir le code par SMS" onPress={handleDemanderCode} loading={loading} />
          </View>
        </>
      )}

      {vue === 'code' && (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Code de vérification</Text>
            {info && <Text style={styles.subtitle}>{info}</Text>}
          </View>

          <View style={styles.form}>
            <TextField label="Code reçu par SMS" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" autoCapitalize="none" />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button label="Continuer" onPress={handleVerifierCode} loading={loading} />
            <Pressable
              style={styles.retour}
              onPress={() => {
                setError(null)
                setCode('')
                setVue('contact')
              }}
            >
              <Text style={styles.retourText}>Changer de numéro</Text>
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.page, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  logo: { width: 180, height: 52, alignSelf: 'center' },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.inkMuted, lineHeight: 20, textAlign: 'center' },
  form: { gap: spacing.md },
  retour: { alignSelf: 'center' },
  retourText: { color: colors.teal, fontSize: 13, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
})
