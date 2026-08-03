import { colours, spacing, shadows, borderRadius, typography, zIndex, dimensions, getColors, getShadows } from '../../styles/variables'
import type { ThemeMode } from '../../styles/variables'

export const appLauncherStyles = {
  container: {
    position: 'absolute' as const,
    top: 60,
    right: { xs: '2.5vw', sm: '10vw', md: '15vw', lg: 40 },
    width: { xs: '95vw', sm: '80vw', md: '70vw', lg: '560px' },
    maxWidth: '800px',
    maxHeight: { xs: 'calc(100vh - 80px)', md: '335px' },
    borderRadius: borderRadius.default,
    boxShadow: shadows.dropdown,
    p: spacing.lg,
    backgroundColor: colours.bg.white,
    zIndex: zIndex.overlay,
  },
  scrollContainer: {
    mt: spacing.md,
    maxHeight: { xs: '300px', md: '220px' },
    overflowY: 'auto' as const,
  },
  appItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    p: spacing.xs,
    borderRadius: borderRadius.default,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: colours.bg.light,
    },
  },
  iconContainer: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.default,
    border: `1px solid ${colours.border.light}`,
    mb: spacing.sm,
  },
  iconStyle: {
    fontSize: dimensions.iconSize.md,
    color: colours.text.secondary,
  },
  appName: {
    fontWeight: typography.weights.regular,
    color: colours.text.secondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center' as const,
    lineHeight: 1.3,
    maxWidth: '100%',
    wordWrap: 'break-word' as const,
    letterSpacing: typography.letterSpacing.default,
  },
}

export const getAppLauncherStyles = (mode: ThemeMode) => {
  const colors = getColors(mode)
  const themeShadows = getShadows(mode)
  return {
    container: {
      position: 'absolute' as const,
      top: 60,
      right: 40,
      width: { xs: '90vw', sm: '70vw', md: '60vw', lg: '50vw' },
      maxWidth: '600px',
      maxHeight: { xs: 'calc(100vh - 80px)', md: '335px' },
      borderRadius: borderRadius.default,
      boxShadow: themeShadows.dropdown,
      p: spacing.lg,
      backgroundColor: colors.bg.white,
      zIndex: zIndex.overlay,
    },
    scrollContainer: {
      mt: spacing.md,
      maxHeight: { xs: '300px', md: '220px' },
      overflowY: 'auto' as const,
    },
    appItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      p: spacing.xs,
      borderRadius: borderRadius.default,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: colors.bg.light,
      },
    },
    iconContainer: {
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: spacing.sm,
    },
    iconStyle: {
      fontSize: '40px',
      color: colors.text.secondary,
    },
    appName: {
      fontWeight: typography.weights.regular,
      color: colors.text.secondary,
      fontSize: typography.sizes.xs,
      textAlign: 'center' as const,
      lineHeight: 1.3,
      maxWidth: '100%',
      wordWrap: 'break-word' as const,
      letterSpacing: typography.letterSpacing.default,
    },
  }
}
