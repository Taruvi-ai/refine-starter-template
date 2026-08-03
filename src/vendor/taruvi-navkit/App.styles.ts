import { colours, dimensions, getColors } from './styles/variables'
import type { ThemeMode } from './styles/variables'

export const appStyles = {
  appBar: {
    height: dimensions.navHeight,
  },
  toolbar: {
    backgroundColor: colours.bg.white,
    justifyContent: 'space-between',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    gap: '10px',
    width: 'fit-content',
    cursor: 'pointer',
    textDecoration: 'none',
    color: 'inherit',
  },
  logo: {
    maxHeight: '40px',
    cursor: 'pointer',
  },
  defaultLogo: {
    maxHeight: '22px',
    cursor: 'pointer',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCard: {
    width: '90vw',
    maxWidth: '1200px',
    height: '80vh',
    outline: 'none',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  chatHeader: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    zIndex: 1400,
    padding: '8px',
  },
  chatOpenButton: {
    backgroundColor: colours.bg.white,
    '&:hover': {
      backgroundColor: colours.bg.light,
    },
  },
  iconStyle: {
    cursor: 'pointer',
    fontSize: '20px',
  },
  backdrop: {
    position: "absolute" as const,
    inset: 0,
    zIndex: 10,
  },
}

export const getAppStyles = (mode: ThemeMode) => {
  const colors = getColors(mode)
  return {
    appBar: {
      height: dimensions.navHeight,
      overflow: 'hidden',
    },
    toolbar: {
      backgroundColor: '#004369',
      boxShadow: ' 0px 0px 10px 2px rgba(0, 0, 0, 0.3)',
      justifyContent: 'space-between',
      minHeight: `${dimensions.navHeight} !important`,
      height: dimensions.navHeight,
      px: '18px !important',
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'start',
      gap: '10px',
      width: 'fit-content',
      cursor: 'pointer',
      textDecoration: 'none',
      color: 'inherit',
    },
    logo: {
      maxHeight: '40px',
      cursor: 'pointer',
    },
    defaultLogo: {
      maxHeight: '22px',
      cursor: 'pointer',
    },
    appName: {
      color: '#ffffff',
      fontSize: '18px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    taruviSpaceLogo: {
      height: '22px',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      gap: '10px',
    },
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatCard: {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      outline: 'none',
      overflow: 'hidden',
      position: 'relative' as const,
      backgroundColor: colors.bg.white,
    },
    chatHeader: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      zIndex: 1400,
      padding: '8px',
    },
    chatOpenButton: {
      backgroundColor: colors.bg.white,
      '&:hover': {
        backgroundColor: colors.bg.light,
      },
    },
    iconStyle: {
      cursor: 'pointer',
      fontSize: '20px',
      color: colors.text.secondary,
    },
    appLauncherContainer: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 40,
      minHeight: 40,
    },
    appLauncherLogo: {
      width: 23,
      height: 23,
    },
    appLauncherHover: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appLauncherIcon: {
      fontSize: 18,
      color: '#ffffff',
    },
    appLauncherText: {
      fontSize: 10,
      color: '#ffffff',
      lineHeight: 1,
      marginTop: '2px',
    },
    backdrop: {
      position: "fixed" as const,
      inset: 0,
      zIndex: 10,
    },
  }
}
