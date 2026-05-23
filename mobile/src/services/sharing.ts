import { Platform, Share } from 'react-native'
import * as Linking from 'expo-linking'

export async function shareContent(title: string, content: string, url?: string) {
  try {
    await Share.share({
      message: `${title}\n\n${content}${url ? `\n\n${url}` : ''}`,
      title,
    })
  } catch {}
}

export function handleDeepLink(url: string): string | null {
  if (!url) return null
  const parsed = Linking.parse(url)
  const path = parsed.path || parsed.hostname || ''
  const validScreens = ['Dashboard', 'Lab', 'Agents', 'Courses', 'Subjects', 'Notes', 'Challenges']
  const matched = validScreens.find((s) => path.toLowerCase().includes(s.toLowerCase()))
  return matched || null
}

export function getAppStoreUrl(): string {
  return Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/masar/id0000000000'
    : 'https://play.google.com/store/apps/details?id=com.masar.mobile'
}
