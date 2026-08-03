import { Card, MenuItem, Typography, SvgIcon } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { AppData } from '../../types'
import { getShortcutsMenuStyles } from './ShortcutsMenu.styles'
import { useNavigation } from '../../NavkitContext'

const ChatIcon = ({ style }: { style: Record<string, any> }) => (
    <SvgIcon viewBox="-2 -2 24 24" sx={{ fontSize: style.fontSize, color: style.color }}>
        <path d="M18 0H2C0.9 0 0 0.9 0 2V20L4 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0Z" fill="currentColor"/>
    </SvgIcon>
)

interface ShortcutsMenuProps {
    showChat: (showChat: boolean) => void
}

const ShortcutsMenu = (props: ShortcutsMenuProps) => {
    const { showChat } = props
    const { navigateToUrl, siteSettings, isUserAuthenticated, themeMode } = useNavigation()
    const shortcuts = siteSettings.shortcuts
    const themedStyles = getShortcutsMenuStyles(themeMode)

    const handleShortcutClick = (shortcut: AppData) => {
        if (shortcut.url) {
            navigateToUrl(shortcut.url, false)
        }
    }

    return (
        <Card sx={themedStyles.menu}>
            {siteSettings['show-chat'] && siteSettings['chat-url'] && isUserAuthenticated && (
                <MenuItem
                    key="chat"
                    onClick={() => showChat(true)}
                    sx={themedStyles.menuItem}
                >
                    <ChatIcon style={themedStyles.iconStyle} />
                    <Typography sx={themedStyles.menuItemText}>
                        Chat
                    </Typography>
                </MenuItem>
            )}
            {shortcuts?.map((shortcut) => (
                <MenuItem
                    key={shortcut.id}
                    onClick={() => handleShortcutClick(shortcut)}
                    sx={themedStyles.menuItem}
                >
                    <FontAwesomeIcon
                        icon={["far", shortcut.icon] as any}
                        style={themedStyles.iconStyle}
                    />
                    <Typography sx={themedStyles.menuItemText}>
                        {shortcut.appname}
                    </Typography>
                </MenuItem>
            ))}
        </Card>
    )
}

export default ShortcutsMenu
