// Common Style Patterns - Reusable style objects

export const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export const flexRow = {
  display: 'flex',
  alignItems: 'center',
}

export const flexColumn = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
}

export const hoverFade = {
  '&:hover': {
    opacity: 0.7,
  },
}

export const hoverBgLight = {
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
}

export const cursorPointer = {
  cursor: 'pointer',
}

export const absolutePositioned = {
  position: 'absolute' as const,
}

export const relativePositioned = {
  position: 'relative' as const,
}
