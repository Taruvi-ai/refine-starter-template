// Design Tokens - Centralized design values for consistent theming

export type ThemeMode = 'light' | 'dark'

export const lightColors = {
  text: {
    primary: '#333333',
    secondary: '#424242',
    tertiary: '#9e9e9e',
  },
  bg: {
    white: '#fff',
    light: '#f5f5f5',
    avatar: '#E0E0E0',
  },
  border: {
    light: '#e0e0e0',
  },
}

export const darkColors = {
  text: {
    primary: '#f5f5f5',
    secondary: '#e0e0e0',
    tertiary: '#9e9e9e',
  },
  bg: {
    white: '#111827',
    light: '#2d2d2d',
    avatar: '#424242',
  },
  border: {
    light: '#424242',
  },
}

export const getColors = (mode: ThemeMode) => mode === 'dark' ? darkColors : lightColors

// Default colors (light mode) for backwards compatibility
export const colours = lightColors

export const spacing = {
  xs: '10px',
  sm: 1.5,
  md: 2,
  lg: 3,
}

export const shadows = {
  dropdown: '0 4px 20px rgba(0,0,0,0.1)',
}

export const getShadows = (mode: ThemeMode) => ({
  dropdown: mode === 'dark'
    ? '0 4px 20px rgba(255,255,255,0.1)'
    : '0 4px 20px rgba(0,0,0,0.1)',
})

export const borderRadius = {
  default: 2,
}

export const typography = {
  sizes: {
    xs: '0.8125rem',
    sm: '0.875rem',
    md: '1.125rem',
  },
  weights: {
    regular: 400,
    semibold: 600,
  },
  letterSpacing: {
    default: '0.5px',
  },
}

export const zIndex = {
  overlay: 1300,
}

export const dimensions = {
  navHeight: '60px',
  avatarSize: 20,
  iconSize: {
    sm: '18px',
    md: '24px',
    lg: '1.25rem',
  },
}
