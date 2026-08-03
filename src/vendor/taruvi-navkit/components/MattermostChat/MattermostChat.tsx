import { useEffect, useRef, useState } from 'react'
import { Box, Badge, CircularProgress, Typography } from '@mui/material'

interface MattermostChatProps {
  jwtToken: string
  mattermostUrl: string
  loginId: string
  onNotification?: (count: number) => void
  onUrlClick?: (url: string) => void
  width?: string | number
  height?: string | number
}

interface NotifyMessage {
  event: string
  data?: {
    title?: string
    body?: string
    channel?: string
    teamId?: string
    url?: string
  }
}

const MattermostChat = ({
  jwtToken,
  mattermostUrl,
  loginId,
  onNotification,
  onUrlClick,
  width = '100%',
  height = '100%'
}: MattermostChatProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isWindowFocused, setIsWindowFocused] = useState(true)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Authenticate with Mattermost on mount
  useEffect(() => {
    const login = async () => {
      try {
        const res = await fetch(`${mattermostUrl.replace(/\/$/, '')}/api/v4/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'omit',
          body: JSON.stringify({ login_id: loginId, password: jwtToken, token: '', deviceId: '' })
        })

        if (!res.ok) {
          setAuthError(`Login failed (${res.status})`)
          setIsLoading(false)
          return
        }

        const token = res.headers.get('Token')
        if (token) {
          setAuthToken(token)
        } else {
          setAuthError('No token in response')
        }
      } catch (e: any) {
        setAuthError(e.message || 'Login failed')
      }
      setIsLoading(false)
    }

    if (loginId && jwtToken) login()
    else { setAuthError('Missing credentials'); setIsLoading(false) }
  }, [mattermostUrl, loginId, jwtToken])

  // Inject auth token into iframe via postMessage once loaded
  useEffect(() => {
    if (!authToken || !iframeRef.current) return

    const handleIframeLoad = () => {
      // Set the auth cookie/token in the iframe context
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'token', data: authToken },
        new URL(mattermostUrl).origin
      )
    }

    const iframe = iframeRef.current
    iframe.addEventListener('load', handleIframeLoad)
    return () => iframe.removeEventListener('load', handleIframeLoad)
  }, [authToken, mattermostUrl])

  useEffect(() => {
    const handleMessage = (event: MessageEvent<NotifyMessage>) => {
      const mattermostOrigin = new URL(mattermostUrl).origin
      if (event.origin !== mattermostOrigin) return

      if (event.data?.event === 'Notify') {
        if (!isWindowFocused) {
          setUnreadCount(prev => {
            const newCount = prev + 1
            onNotification?.(newCount)
            return newCount
          })
        }
        if (event.data.data?.url && onUrlClick) onUrlClick(event.data.data.url)
      }
    }

    const handleFocus = () => { setIsWindowFocused(true); setUnreadCount(0); onNotification?.(0) }
    const handleBlur = () => setIsWindowFocused(false)

    window.addEventListener('message', handleMessage)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [mattermostUrl, isWindowFocused, onNotification, onUrlClick])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, height }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (authError) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, height }}>
        <Typography color="error">{authError}</Typography>
      </Box>
    )
  }

  // Load Mattermost with the auth token as a cookie header via the access_token param
  const iframeUrl = `${mattermostUrl.replace(/\/$/, '')}?access_token=${authToken}`

  return (
    <Box sx={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {unreadCount > 0 && (
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            position: 'absolute', top: 16, right: 16, zIndex: 1000,
            '& .MuiBadge-badge': { fontSize: '1rem', height: '28px', minWidth: '28px', borderRadius: '14px' }
          }}
        />
      )}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title="Mattermost Chat"
        allow="clipboard-read; clipboard-write"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </Box>
  )
}

export default MattermostChat
