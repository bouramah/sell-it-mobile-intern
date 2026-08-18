import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import PickerField from '../components/PickerField'
import RecommandationRail from '../components/RecommandationRail'
import Screen from '../components/Screen'
import { api, resolveImageUrl } from '../api/client'
import { useCart } from '../lib/CartContext'
import { formatGNF } from '../lib/format'
import { colors, radius, spacing } from '../lib/theme'
import type { Boutique, ProduitCatalogue, ProduitRecommande } from '../types'

const SECTEUR_LABELS: Record<string, string> = {
  alimentation_generale: 'Alimentation générale',
  habillement: 'Habillement',
  electronique_electromenager: 'Électronique / Électroménager',
}

export default function CatalogueScreen() {
  const navigation = useNavigation<{ navigate: (screen: string, params: unknown) => void }>()
  const { boutiqueId, boutiqueNom, choisirBoutique, ajouter } = useCart()
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [produits, setProduits] = useState<ProduitCatalogue[]>([])
  const [tendances, setTendances] = useState<ProduitRecommande[]>([])
  const [query, setQuery] = useState('')
  const [secteur, setSecteur] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    api.boutiques().then(setBoutiques).catch(() => {})
    api.tendances().then(setTendances).catch(() => {})
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    api
      .produits({ boutique_id: boutiqueId || undefined, secteur: secteur || undefined, q: query || undefined })
      .then((p) => {
        setProduits(p)
        setLoadError(null)
      })
      .catch((e) => setLoadError(e instanceof Error && e.message ? e.message : 'Échec du chargement du catalogue.'))
      .finally(() => setLoading(false))
  }, [boutiqueId, secteur, query])

  useEffect(refresh, [refresh])

  return (
    <Screen title="Catalogue" error={loadError} scroll={false}>
      <View style={styles.filtres}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un produit…"
            placeholderTextColor={colors.inkMuted}
            style={styles.search}
          />
        </View>
        <PickerField
          label=""
          value={boutiqueId ?? ''}
          onChange={(id) => {
            if (!id) {
              choisirBoutique(null, null)
              return
            }
            const b = boutiques.find((x) => x.id === id)
            if (b) choisirBoutique(b.id, b.nom)
          }}
          options={boutiques.map((b) => ({ value: b.id, label: `${b.nom} — ${b.quartier}, ${b.ville}` }))}
          placeholder="Toutes les boutiques"
          allowEmpty="Toutes les boutiques"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable style={[styles.chip, !secteur && styles.chipActive]} onPress={() => setSecteur('')}>
            <Text style={[styles.chipText, !secteur && styles.chipTextActive]}>Tous</Text>
          </Pressable>
          {Object.entries(SECTEUR_LABELS).map(([value, label]) => (
            <Pressable key={value} style={[styles.chip, secteur === value && styles.chipActive]} onPress={() => setSecteur(value === secteur ? '' : value)}>
              <Text style={[styles.chipText, secteur === value && styles.chipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={produits}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.teal} />}
        ListHeaderComponent={
          !query && tendances.length > 0 ? (
            <RecommandationRail
              titre="Tendances du réseau"
              produits={tendances}
              onPressProduit={(p) => navigation.navigate('Produit', { produit: p })}
            />
          ) : null
        }
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>Aucun produit ne correspond à votre recherche.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => navigation.navigate('Produit', { produit: item })}>
            <View>
              {item.images[0] ? (
                <Image source={{ uri: resolveImageUrl(item.images[0]) }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={28} color={colors.inkMuted} />
                </View>
              )}
              {item.images.length > 1 && (
                <View style={styles.photosBadge}>
                  <Ionicons name="images-outline" size={11} color={colors.white} />
                  <Text style={styles.photosBadgeText}>{item.images.length}</Text>
                </View>
              )}
              {item.disponible === 0 && (
                <View style={styles.rupturOverlay}>
                  <Text style={styles.rupturOverlayText}>Rupture</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.nom} numberOfLines={2}>{item.nom}</Text>
              <View style={styles.prixRow}>
                <Text style={styles.prix}>{formatGNF(item.prix_detail)}</Text>
                {item.disponible > 0 && (
                  <View style={styles.dispoDot} />
                )}
              </View>
              {item.disponible > 0 && (
                <Text style={styles.dispoText} numberOfLines={1}>
                  {boutiqueId ? `${item.disponible} en stock` : `${item.boutiques_disponibles.length} boutique(s)`}
                </Text>
              )}
              <Pressable
                style={[styles.addButton, item.disponible === 0 && styles.addButtonDisabled]}
                disabled={item.disponible === 0}
                onPress={(e) => {
                  e.stopPropagation()
                  if (!boutiqueId) {
                    navigation.navigate('Produit', { produit: item })
                    return
                  }
                  ajouter(item)
                }}
              >
                <Ionicons name="add" size={16} color={colors.white} />
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      {boutiqueNom && (
        <View style={styles.boutiqueBanner}>
          <Ionicons name="storefront" size={13} color={colors.tealDark} />
          <Text style={styles.boutiqueBannerText}>Achat depuis : {boutiqueNom}</Text>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  filtres: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.input, paddingHorizontal: 12, backgroundColor: colors.card,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  search: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.ink },
  chips: { flexDirection: 'row', gap: spacing.xs },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  chipActive: { backgroundColor: colors.tealLight, borderColor: colors.tealBorder },
  chipText: { fontSize: 12, color: colors.inkMuted, fontWeight: '600' },
  chipTextActive: { color: colors.tealDark },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  row: { gap: spacing.md },
  card: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.cardBorder,
    overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  image: { width: '100%', height: 128, backgroundColor: colors.page },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photosBadge: {
    position: 'absolute', right: spacing.xs, top: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(18, 18, 15, 0.55)', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3,
  },
  photosBadgeText: { color: colors.white, fontSize: 10.5, fontWeight: '700' },
  rupturOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 18, 15, 0.35)', alignItems: 'center', justifyContent: 'center' },
  rupturOverlayText: { color: colors.white, fontSize: 12, fontWeight: '700', backgroundColor: colors.danger, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  cardBody: { padding: spacing.sm, paddingBottom: 40, gap: 4, position: 'relative' },
  nom: { fontSize: 13, fontWeight: '600', color: colors.ink, minHeight: 34 },
  prixRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prix: { fontSize: 14.5, fontWeight: '800', color: colors.tealDark },
  dispoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  dispoText: { fontSize: 11, color: colors.inkMuted },
  addButton: {
    position: 'absolute', right: spacing.sm, bottom: spacing.sm, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.teal,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  addButtonDisabled: { backgroundColor: colors.inkMuted, shadowOpacity: 0 },
  empty: { textAlign: 'center', color: colors.inkMuted, marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  boutiqueBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.tealLight, paddingVertical: 8, paddingHorizontal: spacing.lg },
  boutiqueBannerText: { fontSize: 12, color: colors.tealDark, fontWeight: '600' },
})
