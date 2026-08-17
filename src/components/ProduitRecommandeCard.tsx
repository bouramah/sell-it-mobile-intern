import { Ionicons } from '@expo/vector-icons'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { resolveImageUrl } from '../api/client'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import type { ProduitRecommande } from '../types'

export default function ProduitRecommandeCard({ produit, onPress }: { produit: ProduitRecommande; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {produit.images[0] ? (
        <Image source={{ uri: resolveImageUrl(produit.images[0]) }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={22} color={colors.inkMuted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.nom} numberOfLines={2}>{produit.nom}</Text>
        <Text style={styles.prix}>{formatGNF(produit.prix_detail)}</Text>
        <Text style={styles.raison} numberOfLines={1}>{produit.raison}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 128, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  image: { width: '100%', height: 88, backgroundColor: colors.page },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.sm, gap: 2 },
  nom: { fontSize: 12, fontWeight: '600', color: colors.ink, minHeight: 30 },
  prix: { fontSize: 12.5, fontWeight: '800', color: colors.tealDark },
  raison: { fontSize: 10, color: colors.inkMuted },
})
