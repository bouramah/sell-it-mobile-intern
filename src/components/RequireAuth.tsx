import type { ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import LoginScreen from '../screens/LoginScreen'
import { useAuth } from '../lib/AuthContext'
import { colors } from '../lib/theme'

/** Gate un écran derrière la connexion — utilisé par les onglets Commandes et Compte, qui
 * n'ont pas de sens pour un visiteur non identifié (contrairement au Catalogue, consultable
 * librement, cf. décision produit du 2026-08-15). */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { client, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    )
  }
  if (!client) return <LoginScreen />
  return <>{children}</>
}
