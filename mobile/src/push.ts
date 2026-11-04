import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { api } from './api'

// Show our notifications as banners even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
})

export type PushStatus = 'granted' | 'undetermined' | 'denied' | 'unsupported'

export async function pushStatus(): Promise<PushStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported'
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'
}

/** Asks permission if needed, then registers this phone's Expo push token with the backend. */
export async function registerForPush(ask: boolean): Promise<PushStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'unsupported'
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('weekend', {
      name: 'Wedding weekend',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#c8a95f',
    })
  }
  let { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted' && ask) status = (await Notifications.requestPermissionsAsync()).status
  if (status !== 'granted') return status === 'denied' ? 'denied' : 'undetermined'
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) throw new Error('This build is missing its Expo project ID, so notifications can’t be set up.')
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  await api('push/expo', { body: { token } })
  return 'granted'
}

/** Turns a notification's `/app/#seat` style link into one of the app's tabs. */
export function tabFromUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null
  const hash = url.split('#')[1]
  return hash ?? null
}
