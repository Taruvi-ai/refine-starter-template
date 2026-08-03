import { colours, spacing, shadows, borderRadius, typography, zIndex, dimensions, getColors, getShadows } from '../../styles/variables'
import type { ThemeMode } from '../../styles/variables'

export const shortcutsMenuStyles = {
  menu: {
    position: 'absolute' as const,
    top: 60,
    right: 0,
    width: 200,
    borderRadius: borderRadius.default,
    boxShadow: shadows.dropdown,
    backgroundColor: colours.bg.white,
    zIndex: zIndex.overlay,
    py: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    px: spacing.md,
    py: spacing.sm,
    '&:hover': {
      backgroundColor: colours.bg.light,
    },
  },
  menuItemText: {
    color: colours.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
  },
  iconStyle: {
    fontSize: dimensions.iconSize.sm,
    color: colours.text.secondary,
  },
}

export const getShortcutsMenuStyles = (mode: ThemeMode) => {
  const colors = getColors(mode)
  const themeShadows = getShadows(mode)
  return {
    menu: {
      position: 'absolute' as const,
      top: 60,
      right: 0,
      width: 200,
      borderRadius: borderRadius.default,
      boxShadow: themeShadows.dropdown,
      backgroundColor: colors.bg.white,
      zIndex: zIndex.overlay,
      py: 1,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      px: spacing.md,
      py: spacing.sm,
      '&:hover': {
        backgroundColor: colors.bg.light,
      },
    },
    menuItemText: {
      color: colors.text.secondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.regular,
    },
    iconStyle: {
      fontSize: dimensions.iconSize.sm,
      color: colors.text.secondary,
    },
    themeIcon: {
      fontSize: dimensions.iconSize.sm,
      color: colors.text.secondary,
    },
  }
}
