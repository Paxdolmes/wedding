import * as Notifications from 'expo-notifications'

/** The `url` of the notification the guest last tapped, including the one that launched the app. */
export function useNotificationTap(): unknown {
  return Notifications.useLastNotificationResponse()?.notification.request.content.data?.url
}
