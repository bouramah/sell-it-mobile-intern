import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import Badge from '../components/Badge'
import Button from '../components/Button'
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

const GALERIE_LARGEUR = Dimensions.get('window').width - spacing.lg * 2

function GalerieImages({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<string>>(null)

  if (images.length === 0) {
    return (
      <View style={[styles.image, styles.imagePlaceholder]}>
        <Ionicons name="image-outline" size={48} color={colors.inkMuted} />
      </View>
    )
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / GALERIE_LARGEUR)
    if (i !== index) setIndex(i)
  }

  return (
    <View>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(uri, i) => `${uri}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => <Image source={{ uri: resolveImageUrl(item) }} style={styles.image} resizeMode="cover" />}
      />
      {images.length > 1 && (
        <>
          <View style={styles.galerieCompteur}>
            <Text style={styles.galerieCompteurText}>{index + 1}/{images.length}</Text>
          </View>
          <View style={styles.galeriePoints}>
            {images.map((_, i) => (
              <Pressable
                key={i}
                hitSlop={8}
                onPress={() => { listRef.current?.scrollToIndex({ index: i, animated: true }); setIndex(i) }}
                style={[styles.galeriePoint, i === index && styles.galeriePointActif]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  )
}

export default function ProduitScreen() {
  const navigation = useNavigation<{ goBack: () => void; navigate: (screen: string, params: unknown) => void }>()
  const route = useRoute<any>()
  const produit = route.params.produit as ProduitCatalogue
  const { boutiqueId, boutiqueNom, choisirBoutique, ajouter } = useCart()

  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [ajoute, setAjoute] = useState(false)
  const [similaires, setSimilaires] = useState<ProduitRecommande[]>([])
  const [complementaires, setComplementaires] = useState<ProduitRecommande[]>([])

  useEffect(() => {
    api.boutiques().then((liste) => setBoutiques(liste.filter((b) => produit.boutiques_disponibles.includes(b.id)))).catch(() => {})
  }, [produit.boutiques_disponibles])

  useEffect(() => {
    api.produitsSimilaires(produit.id).then(setSimilaires).catch(() => {})
    api.produitsComplementaires(produit.id).then(setComplementaires).catch(() => {})
  }, [produit.id])

  function voirProduit(p: ProduitRecommande) {
    navigation.navigate('Produit', { produit: p })
  }

  const boutiqueValide = boutiqueId && produit.boutiques_disponibles.includes(boutiqueId)

  function handleAjouter() {
    ajouter(produit)
    setAjoute(true)
    setTimeout(() => setAjoute(false), 1500)
  }

  return (
    <Screen title="Produit" showHeader={false} footer={
      boutiqueValide ? (
        <Button label={ajoute ? 'Ajouté au panier ✓' : 'Ajouter au panier'} icon={ajoute ? 'checkmark' : 'cart'} onPress={handleAjouter} disabled={produit.disponible === 0} />
      ) : undefined
    }>
      <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={18} color={colors.teal} />
        <Text style={styles.backRowText}>Retour au catalogue</Text>
      </Pressable>

      <GalerieImages images={produit.images} />

      <View style={styles.info}>
        <Text style={styles.nom}>{produit.nom}</Text>
        <Text style={styles.categorie}>{SECTEUR_LABELS[produit.secteur] ?? produit.secteur} · {produit.categorie}</Text>
        <Text style={styles.prix}>{formatGNF(produit.prix_detail)} <Text style={styles.unite}>/ {produit.unite}</Text></Text>

        {produit.disponible > 0 ? (
          <Badge label="En stock" tone="success" />
        ) : (
          <Badge label="Rupture de stock" tone="danger" />
        )}

        {(produit.prix_semi_gros !== produit.prix_detail || produit.prix_gros !== produit.prix_detail) && (
          <View style={styles.paliers}>
            <Text style={styles.palierLigne}>Semi-gros : {formatGNF(produit.prix_semi_gros)}</Text>
            <Text style={styles.palierLigne}>Gros : {formatGNF(produit.prix_gros)}</Text>
          </View>
        )}
      </View>

      <View style={styles.boutiqueBloc}>
        <Text style={styles.boutiqueLabel}>Boutique pour cet achat</Text>
        <PickerField
          label=""
          value={boutiqueId ?? ''}
          onChange={(id) => {
            const b = boutiques.find((x) => x.id === id)
            if (b) choisirBoutique(b.id, b.nom)
          }}
          options={boutiques.map((b) => ({ value: b.id, label: `${b.nom} — ${b.quartier}, ${b.ville}` }))}
          placeholder="Choisir une boutique disponible"
        />
        {boutiqueId && !boutiqueValide && (
          <Text style={styles.attention}>Ce produit n'est pas disponible dans {boutiqueNom} — choisissez une autre boutique.</Text>
        )}
      </View>

      <RecommandationRail titre="Vous aimerez aussi" produits={similaires} onPressProduit={voirProduit} />
      <RecommandationRail titre="Souvent acheté avec" produits={complementaires} onPressProduit={voirProduit} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backRowText: { color: colors.teal, fontSize: 14, fontWeight: '600' },
  image: { width: GALERIE_LARGEUR, height: 220, borderRadius: radius.card, backgroundColor: colors.page },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  galerieCompteur: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: 'rgba(18, 18, 15, 0.55)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  galerieCompteurText: { color: colors.white, fontSize: 11.5, fontWeight: '700' },
  galeriePoints: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  galeriePoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cardBorder },
  galeriePointActif: { backgroundColor: colors.teal, width: 16 },
  info: { gap: spacing.xs },
  nom: { fontSize: 19, fontWeight: '800', color: colors.ink },
  categorie: { fontSize: 13, color: colors.inkMuted },
  prix: { fontSize: 22, fontWeight: '800', color: colors.tealDark, marginTop: 4 },
  unite: { fontSize: 13, fontWeight: '400', color: colors.inkMuted },
  paliers: { marginTop: spacing.xs, gap: 2 },
  palierLigne: { fontSize: 12.5, color: colors.inkMuted },
  boutiqueBloc: { gap: spacing.xs, marginTop: spacing.sm },
  boutiqueLabel: { fontSize: 13, fontWeight: '600', color: colors.inkMuted2 },
  attention: { fontSize: 12, color: colors.warning },
})
