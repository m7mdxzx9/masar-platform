import AsyncStorage from '../utils/asyncStorage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

const NOTIF_KEY = 'masar-notifications-enabled'
const LAST_STUDY_KEY = 'masar-last-study-date'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  return finalStatus === 'granted'
}

export async function scheduleStudyReminder(hour: number = 18, minute: number = 0) {
  const enabled = await AsyncStorage.getItem(NOTIF_KEY)
  if (enabled === 'false') return

  await Notifications.cancelAllScheduledNotificationsAsync()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ تذكير بالمذاكرة',
      body: 'حان وقت الدراسة! افتح مسار وابدأ جلسة تركيز.',
      data: { screen: 'Dashboard' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  })
}

export async function getStudyStreak(): Promise<number> {
  try {
    const last = await AsyncStorage.getItem(LAST_STUDY_KEY)
    if (!last) return 0
    const lastDate = new Date(last)
    const today = new Date()
    const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff <= 1 ? 1 : 0
  } catch {
    return 0
  }
}

export async function markStudyToday() {
  await AsyncStorage.setItem(LAST_STUDY_KEY, new Date().toISOString())
}
