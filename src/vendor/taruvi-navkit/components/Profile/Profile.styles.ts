import { colours, darkColors, spacing, shadows, borderRadius, typography, zIndex, dimensions, getColors, getShadows } from '../../styles/variables'
import type { ThemeMode } from '../../styles/variables'

export const profileStyles = {
  container: {
    position: 'relative' as const,
  },
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    cursor: 'pointer',
  },
  avatar: {
    width: dimensions.avatarSize,
    height: dimensions.avatarSize,
    bgcolor: colours.bg.avatar,
    color: colours.text.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
  },
  name: {
    color: colours.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    letterSpacing: typography.letterSpacing.default,
    display: { xs: 'none', md: 'block' },
  },
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

export const getProfileStyles = (mode: ThemeMode) => {
  const colors = getColors(mode)
  const themeShadows = getShadows(mode)
  return {
    container: {
      position: 'relative' as const,
    },
    trigger: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      cursor: 'pointer',
    },
    avatar: {
      width: dimensions.avatarSize,
      height: dimensions.avatarSize,
      bgcolor: darkColors.bg.avatar,
      color: darkColors.text.primary,
      fontWeight: typography.weights.semibold,
      fontSize: typography.sizes.sm,
    },
    name: {
      color: colors.text.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.regular,
      letterSpacing: typography.letterSpacing.default,
      display: { xs: 'none', md: 'block' },
    },
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
  }
}
