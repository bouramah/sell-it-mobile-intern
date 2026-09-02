import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useCart } from '../lib/CartContext'
import { colors, font, spacing } from '../lib/theme'

export default function Header({ title }: { title: string }) {
  const { nbArticles } = useCart()
  const navigation = useNavigation<{ navigate: (screen: string) => void }>()

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Image source={require('../../assets/logo-transparent.png')} style={styles.logo} resizeMode="contain" />
        <Pressable onPress={() => navigation.navigate('Panier')} style={styles.cart} hitSlop={8}>
          <Ionicons name="cart-outline" size={22} color={colors.ink} />
          {nbArticles > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{nbArticles > 9 ? '9+' : nbArticles}</Text>
            </View>
          )}
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { width: 96, height: 28 },
  cart: { position: 'relative', padding: 2 },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: colors.white, fontSize: 9.5, fontWeight: '700' },
  title: { ...font.title, marginTop: 6 },
})
