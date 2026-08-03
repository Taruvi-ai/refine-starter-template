import { useState } from 'react'
import { Box, Card, CircularProgress, Divider, MenuItem, Typography } from '@mui/material'
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlined from '@mui/icons-material/LightModeOutlined'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { getProfileStyles } from './Profile.styles'
import { useNavigation } from '../../NavkitContext'

const ProfileMenu = () => {
    const { themeMode, toggleTheme, userData, siteSettings, auth, client } = useNavigation()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const styles = getProfileStyles(themeMode)

    // const handlePreferences = () => {
    //     navigateToUrl('preferences', true)
    // }

    const handleLogout = async () => {
        if (isLoggingOut) return

        setIsLoggingOut(true)
        try {
            await auth.logout(`${window.location.origin}/login`)
        } catch {
            client.tokenClient.clearTokens()
            window.location.assign('/login')
        }
    }

    return (
        <Card sx={styles.menu}>
            <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 600, color: styles.menuItemText.color }}>
                    {userData?.full_name}
                </Typography>
            </Box>
            <Divider />
            {/* <MenuItem onClick={handlePreferences} sx={styles.menuItem}>
                <FontAwesomeIcon
                    icon={["fas", "gear"]}
                    style={styles.iconStyle}
                />
                <Typography sx={styles.menuItemText}>
                    Preferences
                </Typography>
            </MenuItem> */}

            {siteSettings.enableDarkMode && (
            <MenuItem onClick={toggleTheme} sx={styles.menuItem}>
                {themeMode === 'dark' ? (
                    <LightModeOutlined sx={styles.iconStyle} />
                ) : (
                    <DarkModeOutlined sx={styles.iconStyle} />
                )}
                <Typography sx={styles.menuItemText}>
                    {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </Typography>
            </MenuItem>
            )}

            {siteSettings.enableDarkMode && <Divider />}
            <MenuItem
                disabled={isLoggingOut}
                onClick={handleLogout}
                sx={{
                    ...styles.menuItem,
                    color: '#c62828',
                    '&.Mui-disabled': {
                        opacity: 0.55,
                    },
                }}
            >
                {isLoggingOut ? (
                    <CircularProgress color="inherit" size={18} />
                ) : (
                    <LogoutRounded sx={{ ...styles.iconStyle, color: 'inherit' }} />
                )}
                <Typography sx={{ ...styles.menuItemText, color: 'inherit' }}>
                    {isLoggingOut ? 'Logging out' : 'Logout'}
                </Typography>
            </MenuItem>

        </Card>
    )
}

export default ProfileMenu
