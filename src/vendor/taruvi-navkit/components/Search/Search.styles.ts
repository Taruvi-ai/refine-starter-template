import { getColors } from '../../styles/variables'
import type { ThemeMode } from '../../styles/variables'

export const searchStyles = {
  textField: {
    '& .MuiOutlinedInput-root': {
      height: '40px',
    },
  },
}

export const getSearchStyles = (mode: ThemeMode) => {
  const colors = getColors(mode)
  return {
    textField: {
      '& .MuiOutlinedInput-root': {
        height: '40px',
        backgroundColor: colors.bg.light,
        '& fieldset': {
          borderColor: colors.border.light,
        },
        '&:hover fieldset': {
          borderColor: colors.text.tertiary,
        },
      },
      '& .MuiOutlinedInput-input': {
        color: colors.text.primary,
      },
      '& .MuiInputBase-input::placeholder': {
        color: colors.text.tertiary,
        opacity: 1,
      },
    },
    iconStyle: {
      color: colors.text.tertiary,
    },
  }
}
