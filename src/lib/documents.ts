import { Directory, File, Paths } from 'expo-file-system'
import * as Print from 'expo-print'
import { isAvailableAsync, shareAsync } from 'expo-sharing'
import { getToken } from './auth'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000/api/v1'

/** Télécharge la facture PDF authentifiée d'une commande puis ouvre le dialogue d'impression
 * natif ; retombe sur le partage classique si aucune imprimante n'est disponible (CDC §3.5 :
 * "historique des commandes et factures consultables et téléchargeables"). */
export async function imprimerOuPartagerFacture(commandeId: string): Promise<void> {
  const token = await getToken()
  const destination = new Directory(Paths.cache, 'documents')
  destination.create({ idempotent: true })
  const task = File.createDownloadTask(`${API_BASE}/mes-commandes/${commandeId}/facture.pdf`, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const file = await task.downloadAsync()
  if (!file) throw new Error('Échec du téléchargement de la facture.')

  try {
    await Print.printAsync({ uri: file.uri })
  } catch {
    if (await isAvailableAsync()) {
      await shareAsync(file.uri, { mimeType: 'application/pdf', UTI: '.pdf' })
    } else {
      throw new Error('Aucune imprimante ni application de partage disponible sur cet appareil.')
    }
  }
}
