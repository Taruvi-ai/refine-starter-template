import { useState, useEffect } from "react"
import type { AppData } from "../../types"
import Search from "../Search/Search"
import { Card, Box, Grid, Typography } from "@mui/material"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { findIconDefinition, type IconName } from "@fortawesome/fontawesome-svg-core"
import { useNavigation } from "../../NavkitContext"
import { getAppLauncherStyles } from "./AppLauncher.styles"
import { typography } from "../../styles/variables"


const isIconUrl = (icon: string): boolean => {
    return icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/')
}

const isValidFaIcon = (icon: string): boolean => {
    const iconName = icon.replace('fa-', '') as IconName
    return !!findIconDefinition({ prefix: 'fas', iconName }) || !!findIconDefinition({ prefix: 'far', iconName })
}

const AppLauncher = () => {
    const { navigateToUrl, appsList, themeMode } = useNavigation()
    const styles = getAppLauncherStyles(themeMode)
    const [filteredApps, setFilteredApps] = useState<AppData[]>(appsList || [])

    const handleAppClick = (app: AppData) => {
        navigateToUrl(app.url, false)
    }

    const handleSearchChange = (filtered: AppData[]) => {
        setFilteredApps(filtered)
    }

    useEffect(() => {
        setFilteredApps(appsList || [])
    }, [appsList])

    return (
        <Card sx={styles.container}>
            <Search appsList={appsList} onSearchChange={handleSearchChange} />
            {filteredApps.filter(app => app.url).length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                    <Typography sx={{ color: styles.appName.color, fontSize: typography.sizes.sm }}>No apps available</Typography>
                </Box>
            ) : (
                <Box sx={styles.scrollContainer}>
                    <Grid container spacing={0}>
                        {filteredApps.filter(app => app.url).map((app) => {
                            return (
                                <Grid size={2} key={app.id}>
                                    <Box
                                        sx={styles.appItem}
                                        onClick={() => handleAppClick(app)}
                                    >
                                        <Box
                                            sx={styles.iconContainer}
                                        >
                                            {isIconUrl(app.icon) ? (
                                                <img
                                                    src={app.icon}
                                                    alt={app.appname}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            ) : app.icon && isValidFaIcon(app.icon) ? (
                                                <FontAwesomeIcon
                                                    icon={["fas", app.icon.replace('fa-', '') as IconName]}
                                                    style={styles.iconStyle}
                                                />
                                            ) : (
                                                <Typography sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                                    {app.appname?.charAt(0).toUpperCase()}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={styles.appName}
                                        >
                                            {app?.appname?.length > 40 ? `${app.appname.substring(0, 40)}...` : app.appname}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>
            )}
        </Card>
    )
}

export default AppLauncher