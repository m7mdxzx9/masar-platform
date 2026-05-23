import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useTheme } from '../theme/ThemeContext'
import { Ionicons } from '@expo/vector-icons'

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home-outline',
  Lab: 'code-working-outline',
  Agents: 'chatbubbles-outline',
  Courses: 'git-network-outline',
  More: 'apps-outline',
}

const tabIconsActive: Record<string, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  Lab: 'code-working',
  Agents: 'chatbubbles',
  Courses: 'git-network',
  More: 'apps',
}

interface TabBarProps {
  tabs: { key: string; label: string }[]
  activeTab: string
  onTabChange: (key: string) => void
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border, shadowColor: colors.accent }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        const iconName = isActive ? (tabIconsActive[tab.key] || 'document') : (tabIcons[tab.key] || 'document-outline')

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            activeOpacity={0.8}
            onPress={() => onTabChange(tab.key)}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isActive ? colors.accent : colors.textMuted}
              style={styles.icon}
            />
            <Text style={[styles.label, { color: isActive ? colors.accent : colors.textMuted }]}>
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={[
                  styles.activeIndicator,
                  {
                    backgroundColor: colors.accent,
                    shadowColor: colors.accent,
                    shadowOpacity: 0.9,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 3,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse', // Support Arabic RTL order
    borderTopWidth: 1.5,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 10,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  icon: { marginBottom: 3 },
  label: { fontSize: 11, fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
})

export default TabBar
