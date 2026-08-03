import type { AppData } from '../../types'
import { Box, Link, IconButton, SvgIcon } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { shortcutsStyles } from './Shortcuts.styles'
import { useNavigation } from '../../NavkitContext'

const ChatIcon = ({ color }: { color?: string }) => (
    <SvgIcon viewBox="-2 -2 24 24" sx={{ fontSize: 23, display: 'block', position: 'relative', top: 2 }}>
        <path d="M18 0H2C0.9 0 0 0.9 0 2V20L4 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0Z" fill={color || "#9DE5FD"}/>
    </SvgIcon>
)

interface ShortcutsProps {
    showChat?: (showChat: boolean) => void
    onMenuToggle?: () => void
    triggerRef?: React.RefObject<HTMLButtonElement | null>
    iconColor?: string
}

const Shortcuts = (props: ShortcutsProps) => {

    const { showChat, onMenuToggle, triggerRef, iconColor } = props
    const { navigateToUrl, siteSettings, isUserAuthenticated } = useNavigation()
    const shortcuts = siteSettings.shortcuts

    const handleShortcutClick = (shortcut: AppData) => {
        if (shortcut.url) {
            navigateToUrl(shortcut.url, false)
        }
    }
    
    return (
        <>
            {/* Desktop view - inline shortcuts */}
            <Box sx={shortcutsStyles.desktopContainer}>
                {shortcuts?.map((shortcut) => (
                    <Link
                        key={shortcut.id}
                        onClick={() => handleShortcutClick(shortcut)}
                        sx={shortcutsStyles.shortcut}
                    >
                        <FontAwesomeIcon
                            icon={["far", shortcut.icon] as any}
                            style={{ ...shortcutsStyles.iconStyle, ...(iconColor && { color: iconColor }) }}
                        />
                    </Link>
                ))}
                {siteSettings['show-chat'] && siteSettings['chat-url'] && isUserAuthenticated &&
                    <Link
                        key={"chat"}
                        onClick={() => showChat?.(true)}
                        sx={shortcutsStyles.shortcut}
                    >
                        <ChatIcon color={iconColor} />
                    </Link>
                }
            </Box>

            {/* Mobile view - trigger button */}
            {((shortcuts?.length ?? 0) > 0 || (siteSettings['show-chat'] && siteSettings['chat-url'] && isUserAuthenticated)) && (
                <IconButton
                    ref={triggerRef}
                    onClick={onMenuToggle}
                    sx={{ ...shortcutsStyles.mobileTrigger, ...(iconColor && { color: iconColor }) }}
                >
                    <FontAwesomeIcon
                        icon={["fas", "ellipsis-v"]}
                        style={{ ...shortcutsStyles.iconStyle, color: iconColor || '#9DE5FD' }}
                    />
                </IconButton>
            )}
        </>
    )
}

export default Shortcuts
