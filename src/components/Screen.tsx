import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ErrorBanner from './ErrorBanner'
import Header from './Header'
import { colors, spacing } from '../lib/theme'

interface ScreenProps {
  title: string
  children: ReactNode
  scroll?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  footer?: ReactNode
  error?: string | null
  showHeader?: boolean
}

export default function Screen({ title, children, scroll = true, onRefresh, refreshing, footer, error, showHeader = true }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, footer ? styles.scrollContentWithFooter : null]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.teal} /> : undefined}
    >
      {error && <ErrorBanner message={error} />}
      {children}
    </ScrollView>
  ) : (
    <View style={styles.flexContent}>
      {error && <ErrorBanner message={error} />}
      {children}
    </View>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {showHeader && <Header title={title} />}
      {content}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  scrollContentWithFooter: { paddingBottom: spacing.xl * 2 },
  flexContent: { flex: 1, padding: spacing.lg },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
})
