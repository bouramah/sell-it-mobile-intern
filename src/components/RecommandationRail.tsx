import { FlatList, StyleSheet, Text, View } from 'react-native'
import ProduitRecommandeCard from './ProduitRecommandeCard'
import { colors, spacing } from '../lib/theme'
import type { ProduitRecommande } from '../types'

// Utilisé dans des conteneurs déjà marginés (le contentContainerStyle padded de CatalogueScreen
// et de ProduitScreen) — pas de marge horizontale propre ici, sous peine de la doubler.
export default function RecommandationRail({
  titre,
  produits,
  onPressProduit,
}: {
  titre: string
  produits: ProduitRecommande[]
  onPressProduit: (produit: ProduitRecommande) => void
}) {
  if (produits.length === 0) return null
  return (
    <View style={styles.wrap}>
      <Text style={styles.titre}>{titre}</Text>
      <FlatList
        data={produits}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProduitRecommandeCard produit={item} onPress={() => onPressProduit(item)} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  titre: { fontSize: 14, fontWeight: '700', color: colors.ink },
  list: { gap: spacing.sm },
})
