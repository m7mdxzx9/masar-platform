import React from 'react'
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native'
import { useTheme } from '../theme/ThemeContext'

interface CardProps {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  variant?: 'default' | 'elevated' | 'outlined'
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const { colors } = useTheme()
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...(variant === 'elevated'
            ? {
                shadowColor: colors.accent,
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 16,
                elevation: 8,
                borderWidth: 0,
              }
            : variant === 'outlined'
            ? {
                borderWidth: 1.5,
                borderColor: colors.accent,
                shadowColor: 'transparent',
                shadowOpacity: 0,
                elevation: 0,
              }
            : {
                borderWidth: 1,
                shadowColor: colors.accent,
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 4,
              }),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
})
