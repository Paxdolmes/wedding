import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

/** The guest and host tokens live in the phone's keychain (or localStorage when previewed on the web). */
export const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') { try { return localStorage.getItem(key) } catch { return null } }
    return SecureStore.getItemAsync(key)
  },
  async set(key: string, value: string | null) {
    if (Platform.OS === 'web') { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* private mode */ } return }
    if (value == null) await SecureStore.deleteItemAsync(key); else await SecureStore.setItemAsync(key, value)
  },
}
