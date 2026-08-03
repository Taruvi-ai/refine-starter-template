# MattermostChat Component

A React component that embeds Mattermost chat in an iframe with JWT authentication, notification tracking, and postMessage communication.

## Features

- 🔐 JWT token authentication via URL parameter
- 🔔 Unread message notification badge
- 📋 Clipboard permissions (read/write)
- 🎯 postMessage listener for Mattermost events
- 🔒 Origin validation for security
- 📱 Responsive and customizable dimensions
- ♻️ Proper cleanup of event listeners

## Installation

The component is already included in your project. Make sure you have the required dependencies:

```bash
npm install @mui/material @emotion/react @emotion/styled
```

## Environment Variables

Create a `.env` file in your project root:

```env
VITE_MATTERMOST_URL=http://localhost:8065
```

For production, update this to your actual Mattermost server URL.

## Usage

### Basic Example

```tsx
import { MattermostChat } from './components'

function App() {
  const jwtToken = 'your-jwt-token-here'

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MattermostChat jwtToken={jwtToken} />
    </div>
  )
}
```

### Advanced Example with Callbacks

```tsx
import { MattermostChat } from './components'
import { useState } from 'react'

function ChatPage() {
  const [notificationCount, setNotificationCount] = useState(0)
  const jwtToken = 'your-jwt-token-here'

  const handleNotification = (count: number) => {
    console.log(`Unread messages: ${count}`)
    setNotificationCount(count)

    // You can trigger browser notifications here
    if (count > 0 && Notification.permission === 'granted') {
      new Notification('New Mattermost Message', {
        body: `You have ${count} unread message(s)`
      })
    }
  }

  const handleUrlClick = (url: string) => {
    console.log(`User clicked URL in Mattermost: ${url}`)
    // Handle navigation or custom logic
  }

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
      <MattermostChat
        jwtToken={jwtToken}
        onNotification={handleNotification}
        onUrlClick={handleUrlClick}
        width="100%"
        height="100%"
      />
    </div>
  )
}
```

### Custom Dimensions

```tsx
<MattermostChat
  jwtToken={jwtToken}
  width="800px"
  height="600px"
/>
```

### Integration with NavKit

```tsx
// In your App.tsx or main component
import { useState } from 'react'
import { MattermostChat } from './components'

function NavkitApp() {
  const [showChat, setShowChat] = useState(false)
  const jwtToken = 'your-jwt-token'

  return (
    <>
      {/* Your existing NavKit code */}
      <AppBar>
        <Toolbar>
          <IconButton onClick={() => setShowChat(!showChat)}>
            <ChatIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mattermost Chat Modal or Sidebar */}
      {showChat && (
        <Box
          sx={{
            position: 'fixed',
            right: 0,
            top: 64,
            width: 400,
            height: 'calc(100vh - 64px)',
            zIndex: 1200,
            boxShadow: 3
          }}
        >
          <MattermostChat jwtToken={jwtToken} />
        </Box>
      )}
    </>
  )
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `jwtToken` | `string` | Yes | - | JWT token for Mattermost authentication |
| `onNotification` | `(count: number) => void` | No | - | Callback when notification count changes |
| `onUrlClick` | `(url: string) => void` | No | - | Callback when user clicks a URL in Mattermost |
| `width` | `string \| number` | No | `'100%'` | Width of the iframe container |
| `height` | `string \| number` | No | `'100%'` | Height of the iframe container |

## How It Works

### Authentication
The component constructs the iframe URL as:
```
${VITE_MATTERMOST_URL}/login?oxauth=${jwtToken}
```

This allows automatic authentication with your Mattermost server using the provided JWT token.

### Notification Tracking
- When the window loses focus (user switches tabs/windows), incoming Mattermost messages increment the unread counter
- A red badge appears in the top-right corner showing the unread count
- When the window regains focus, the counter resets to 0
- The `onNotification` callback is triggered whenever the count changes

### Security
- Origin validation ensures only messages from your configured Mattermost server are processed
- Messages from other origins are logged and ignored
- Clipboard permissions are explicitly granted for proper copy/paste functionality

### postMessage Communication
The component listens for `Notify` events from the Mattermost iframe with the following structure:

```typescript
{
  event: 'Notify',
  data: {
    title: 'Message title',
    body: 'Message content',
    channel: 'channel-id',
    teamId: 'team-id',
    url: 'deep-link-url'
  }
}
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support (with responsive sizing)

## Security Considerations

1. **JWT Token Storage**: Never store JWT tokens in localStorage or sessionStorage if they contain sensitive data. Consider using httpOnly cookies or secure session management.

2. **Origin Validation**: The component validates the origin of postMessage events. Ensure `VITE_MATTERMOST_URL` is set correctly in production.

3. **HTTPS**: In production, always use HTTPS for both your app and Mattermost server.

## Troubleshooting

### Iframe not loading
- Check that `VITE_MATTERMOST_URL` is set correctly in `.env`
- Verify the JWT token is valid
- Check browser console for CORS or CSP errors
- Ensure Mattermost server allows iframe embedding

### Notifications not working
- Verify the window focus/blur events are firing
- Check that postMessage events are being sent from Mattermost
- Ensure origin validation is passing (check console for warnings)

### Clipboard not working
- Verify the `allow` attribute includes clipboard permissions
- Check that the user has granted clipboard permissions in their browser
- Some browsers require HTTPS for clipboard API access

## License

Part of the Taruvi NavKit project.
