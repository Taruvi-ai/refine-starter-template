import { useRef, useState, useCallback, useEffect } from 'react'
import { Box } from '@mui/material'

interface Props {
  children: React.ReactNode
  initialWidth?: number
  initialHeight?: number
  minWidth?: number
  minHeight?: number
  onClose?: () => void
}

const HEADER_HEIGHT = 28

const DraggableResizable = ({
  children,
  initialWidth = 900,
  initialHeight = 600,
  minWidth = 320,
  minHeight = 240,
  onClose,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight })
  const dragOffset = useRef({ x: 0, y: 0 })
  const action = useRef<'drag' | 'resize' | null>(null)

  // Center on mount
  useEffect(() => {
    setPos({
      x: Math.max(0, (window.innerWidth - initialWidth) / 2),
      y: Math.max(0, (window.innerHeight - initialHeight) / 2),
    })
  }, [initialWidth, initialHeight])

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (action.current === 'drag') {
      setPos({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - 100)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 50)),
      })
    } else if (action.current === 'resize') {
      setSize(() => ({
        w: Math.max(minWidth, e.clientX - dragOffset.current.x),
        h: Math.max(minHeight, e.clientY - dragOffset.current.y),
      }))
    }
  }, [minWidth, minHeight])

  const onPointerUp = useCallback(() => {
    action.current = null
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  }, [onPointerMove])

  const startDrag = (e: React.PointerEvent) => {
    action.current = 'drag'
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation()
    action.current = 'resize'
    dragOffset.current = { x: pos.x, y: pos.y }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  return (
    <>
      {/* Backdrop */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1299,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      />
      {/* Window */}
      <Box
        ref={containerRef}
        sx={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backgroundColor: '#fff',
        }}
      >
        {/* Drag handle / title bar */}
        <Box
          onPointerDown={startDrag}
          sx={{
            height: HEADER_HEIGHT,
            backgroundColor: '#e0e0e0',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            userSelect: 'none',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <Box sx={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#999' }} />
        </Box>
        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </Box>
        {/* Resize handle (bottom-right corner) */}
        <Box
          onPointerDown={startResize}
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: 'nwse-resize',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 3,
              right: 3,
              width: 8,
              height: 8,
              borderRight: '2px solid #999',
              borderBottom: '2px solid #999',
            },
          }}
        />
      </Box>
    </>
  )
}

export default DraggableResizable
