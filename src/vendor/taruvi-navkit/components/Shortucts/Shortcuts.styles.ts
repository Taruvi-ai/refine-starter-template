import { colours, spacing, dimensions } from '../../styles/variables'

export const shortcutsStyles = {
  desktopContainer: {
    display: { xs: 'none', md: 'flex' },
    alignItems: 'center',
    gap: '10px',
    ml: spacing.md,
  },
  mobileTrigger: {
    display: { xs: 'flex', md: 'none' },
    ml: spacing.sm,
    color: '#9DE5FD',
  },
  shortcut: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textDecoration: 'none',
    cursor: 'pointer',
    color: colours.text.secondary,
    '&:hover': {
      opacity: 0.7,
    },
  },
  iconStyle: {
    fontSize: '23px',
    color: colours.text.secondary,
  },
}
