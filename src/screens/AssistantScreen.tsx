import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import Screen from '../components/Screen'
import { api } from '../api/client'
import { colors, radius, spacing } from '../lib/theme'

interface Message {
  auteur: 'client' | 'bot'
  texte: string
}

export default function AssistantScreen() {
  const navigation = useNavigation<{ goBack: () => void }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [chargement, setChargement] = useState(true)
  const listRef = useRef<FlatList<Message>>(null)

  useEffect(() => {
    api
      .historiqueAssistant()
      .then((h) => setMessages(h.map((m) => ({ auteur: m.auteur === 'client' ? 'client' : 'bot', texte: m.texte }))))
      .catch(() => {})
      .finally(() => setChargement(false))
  }, [])

  async function envoyer() {
    const texte = saisie.trim()
    if (!texte || envoiEnCours) return
    const historique = messages
    const suivant = [...historique, { auteur: 'client' as const, texte }]
    setMessages(suivant)
    setSaisie('')
    setEnvoiEnCours(true)
    try {
      const { reponse } = await api.envoyerMessageAssistant(texte, historique)
      setMessages((m) => [...m, { auteur: 'bot', texte: reponse }])
    } catch {
      setMessages((m) => [...m, { auteur: 'bot', texte: "Erreur — je n'ai pas pu répondre. Réessayez." }])
    } finally {
      setEnvoiEnCours(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <Screen title="Assistant" showHeader={false} scroll={false}>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.teal} />
        <Text style={styles.backRowText}>Retour</Text>
      </Pressable>

      <View style={styles.avertissement}>
        <Ionicons name="information-circle-outline" size={14} color={colors.inkMuted} />
        <Text style={styles.avertissementTexte}>
          Réponses générées par une IA — peuvent contenir des erreurs. Vérifiez les informations importantes.
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        {chargement ? (
          <View style={styles.vide}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.liste}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.vide}>
                <Ionicons name="chatbubbles-outline" size={36} color={colors.inkMuted} />
                <Text style={styles.videTexte}>
                  Posez une question sur vos commandes, votre crédit, ou le fonctionnement de KFSTORE.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.bulleWrap, item.auteur === 'client' ? styles.bulleWrapClient : styles.bulleWrapBot]}>
                <View style={[styles.bulle, item.auteur === 'client' ? styles.bulleClient : styles.bulleBot]}>
                  <Text style={item.auteur === 'client' ? styles.texteClient : styles.texteBot}>{item.texte}</Text>
                </View>
              </View>
            )}
          />
        )}
        {envoiEnCours && <Text style={styles.enCours}>L'assistant écrit…</Text>}
        <View style={styles.saisieRow}>
          <TextInput
            value={saisie}
            onChangeText={setSaisie}
            placeholder="Écrire un message…"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            onSubmitEditing={envoyer}
            editable={!envoiEnCours}
          />
          <Pressable
            style={[styles.envoyerBtn, (!saisie.trim() || envoiEnCours) && styles.envoyerBtnDisabled]}
            onPress={envoyer}
            disabled={!saisie.trim() || envoiEnCours}
          >
            <Ionicons name="send" size={16} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  backRowText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  avertissement: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  avertissementTexte: { flex: 1, fontSize: 11, color: colors.inkMuted },
  flex: { flex: 1 },
  liste: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  vide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xl * 2 },
  videTexte: { textAlign: 'center', color: colors.inkMuted, fontSize: 13, paddingHorizontal: spacing.xl },
  bulleWrap: { flexDirection: 'row' },
  bulleWrapClient: { justifyContent: 'flex-end' },
  bulleWrapBot: { justifyContent: 'flex-start' },
  bulle: { maxWidth: '85%', borderRadius: radius.card, paddingHorizontal: 12, paddingVertical: 9 },
  bulleClient: { backgroundColor: colors.teal },
  bulleBot: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  texteClient: { color: colors.white, fontSize: 14 },
  texteBot: { color: colors.ink, fontSize: 14 },
  enCours: { fontSize: 12, color: colors.inkMuted, paddingHorizontal: spacing.lg, paddingBottom: 4 },
  saisieRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.card,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.input, paddingHorizontal: 12,
    paddingVertical: 9, fontSize: 14, color: colors.ink, backgroundColor: colors.page,
  },
  envoyerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  envoyerBtnDisabled: { backgroundColor: colors.inkMuted, opacity: 0.6 },
})
