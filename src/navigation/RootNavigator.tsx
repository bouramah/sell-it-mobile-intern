import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import CatalogueScreen from '../screens/CatalogueScreen'
import CommandeDetailScreen from '../screens/CommandeDetailScreen'
import CommandesScreen from '../screens/CommandesScreen'
import CompteScreen from '../screens/CompteScreen'
import CreditScreen from '../screens/CreditScreen'
import PanierScreen from '../screens/PanierScreen'
import ProduitScreen from '../screens/ProduitScreen'
import { CartProvider } from '../lib/CartContext'
import { colors } from '../lib/theme'

const Tabs = createBottomTabNavigator()
const CatalogueStack = createNativeStackNavigator()
const PanierStack = createNativeStackNavigator()
const CommandesStack = createNativeStackNavigator()
const CompteStack = createNativeStackNavigator()

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Catalogue: 'storefront',
  Panier: 'cart',
  Commandes: 'receipt',
  Compte: 'person-circle',
}
const TAB_ICONS_OUTLINE: Record<string, keyof typeof Ionicons.glyphMap> = {
  Catalogue: 'storefront-outline',
  Panier: 'cart-outline',
  Commandes: 'receipt-outline',
  Compte: 'person-circle-outline',
}

function tabIcon(routeName: string) {
  return ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? TAB_ICONS[routeName] : TAB_ICONS_OUTLINE[routeName]} size={size} color={color} />
  )
}

function CatalogueNavigator() {
  return (
    <CatalogueStack.Navigator screenOptions={{ headerShown: false }}>
      <CatalogueStack.Screen name="CatalogueListe" component={CatalogueScreen} />
      <CatalogueStack.Screen name="Produit" component={ProduitScreen} />
    </CatalogueStack.Navigator>
  )
}

function PanierNavigator() {
  return (
    <PanierStack.Navigator screenOptions={{ headerShown: false }}>
      <PanierStack.Screen name="PanierAccueil" component={PanierScreen} />
    </PanierStack.Navigator>
  )
}

function CommandesNavigator() {
  return (
    <CommandesStack.Navigator screenOptions={{ headerShown: false }}>
      <CommandesStack.Screen name="CommandesListe" component={CommandesScreen} />
      <CommandesStack.Screen name="CommandeDetail" component={CommandeDetailScreen} />
    </CommandesStack.Navigator>
  )
}

function CompteNavigator() {
  return (
    <CompteStack.Navigator screenOptions={{ headerShown: false }}>
      <CompteStack.Screen name="CompteAccueil" component={CompteScreen} />
      <CompteStack.Screen name="Credit" component={CreditScreen} />
    </CompteStack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.inkMuted2,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.cardBorder, height: 58, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const },
        tabBarIcon: tabIcon(route.name),
      })}
    >
      <Tabs.Screen name="Catalogue" component={CatalogueNavigator} options={{ title: 'Catalogue' }} />
      <Tabs.Screen name="Panier" component={PanierNavigator} options={{ title: 'Panier' }} />
      <Tabs.Screen name="Commandes" component={CommandesNavigator} options={{ title: 'Commandes' }} />
      <Tabs.Screen name="Compte" component={CompteNavigator} options={{ title: 'Compte' }} />
    </Tabs.Navigator>
  )
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <CartProvider>
        <MainTabs />
      </CartProvider>
    </NavigationContainer>
  )
}
