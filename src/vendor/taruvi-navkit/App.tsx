import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import IconButton from "@mui/material/IconButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useState } from "react"
import { AppLauncher, Profile, ProfileMenu, Shortcuts, ShortcutsMenu, MattermostChat } from "./components"
import { Box, Typography } from "@mui/material";
import DraggableResizable from "./components/DraggableResizable";
import { getAppStyles } from "./App.styles"
import { NavkitProvider, useNavigation } from "./NavkitContext"
import taruviLogo from "./assets/logo.svg";
import taruviLogoWhite from "./assets/taruvi-logo-white.png";
import type { Client } from "@taruvi/sdk"

const NavkitContent = () => {
  const { isUserAuthenticated, siteSettings, appSettings, appSettingsLoaded, appName, userData, jwtToken, themeMode, navbarColor, iconColor } = useNavigation();
  const resolvedAppName = appName || appSettings?.displayName
  const showTaruviLogo = appSettingsLoaded && !resolvedAppName && !appSettings?.icon
  const styles = getAppStyles(themeMode)
  const [showAppLauncher, setShowAppLauncher] = useState<boolean>(false)
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const [showShortcutsMenu, setShowShortcutsMenu] = useState<boolean>(false)
  const [showChat, setShowChat] = useState<boolean>(false)
  const [isAppLauncherHovered, setIsAppLauncherHovered] = useState<boolean>(false);

  return (
    <>
      {(showAppLauncher || showProfileMenu || showShortcutsMenu) && (
        <div
          style={styles.backdrop}
          onClick={() => {
            setShowAppLauncher(false);
            setShowProfileMenu(false);
            setShowShortcutsMenu(false);
          }}
        />
      )}
      <AppBar position="static" sx={styles.appBar}>
        <Toolbar sx={{ ...styles.toolbar, ...(navbarColor && { backgroundColor: navbarColor }) }}>
          <Box component={"a"} href="/" sx={styles.leftSection}>
            {showTaruviLogo ? (
              <Box component="img" src={taruviLogoWhite} sx={styles.taruviSpaceLogo} />
            ) : appSettingsLoaded ? (
              <>
                {appSettings?.icon ? <Box component="img" src={appSettings?.icon} sx={styles.logo} /> : <></>}
                {resolvedAppName &&
                  <Typography sx={styles.appName} onClick={() => (window.location.href = "/")}>
                    {resolvedAppName.length > 40 ? `${resolvedAppName.substring(0, 40)}...` : resolvedAppName}
                  </Typography>
                }
              </>
            ) : null}
          </Box>
          <Box component={"div"} sx={styles.rightSection}>
            <Shortcuts showChat={setShowChat} onMenuToggle={() => setShowShortcutsMenu(!showShortcutsMenu)} iconColor={iconColor} />
            <Box
                onClick={() => {
                  if (isUserAuthenticated) {
                    setShowAppLauncher(!showAppLauncher);
                  }
                }}
                onMouseEnter={() => {
                  if (isUserAuthenticated) {
                    setIsAppLauncherHovered(true);
                  }
                }}
                onMouseLeave={() => setIsAppLauncherHovered(false)}
                sx={{
                  ...styles.appLauncherContainer,
                  cursor: isUserAuthenticated ? "pointer" : "default",
                }}
              >
              {(isAppLauncherHovered || showAppLauncher) && isUserAuthenticated ? (
                <Box sx={styles.appLauncherHover}>
                  <FontAwesomeIcon icon={["fas", "th"]} style={styles.appLauncherIcon} />
                  <Typography sx={styles.appLauncherText}>Apps</Typography>
                </Box>
              ) : (
                <Box component="img" src={taruviLogo} sx={styles.appLauncherLogo} />
              )}
            </Box>
            {isUserAuthenticated && userData && <Profile userData={userData} onClick={() => setShowProfileMenu(!showProfileMenu)} iconColor={iconColor} />}
          </Box>
        </Toolbar>
      </AppBar>

      {showProfileMenu && (
        <Box>
          <ProfileMenu />
        </Box>
      )}

      {showAppLauncher && isUserAuthenticated && (
        <Box>
          <AppLauncher />
        </Box>
      )}


      {showShortcutsMenu && (
        <Box>
          <ShortcutsMenu showChat={setShowChat} />
        </Box>
      )}

      {showChat && siteSettings['chat-url'] && (
        <DraggableResizable onClose={() => setShowChat(false)} initialWidth={Math.min(1200, window.innerWidth * 0.9)} initialHeight={Math.min(600, window.innerHeight * 0.8)}>
          <Box sx={styles.chatHeader}>
            <IconButton onClick={() => window.open(siteSettings['chat-url'], "_blank")} sx={styles.chatOpenButton}>
              <FontAwesomeIcon icon={["fas", "external-link-alt"]} style={{ fontSize: "10px" }} />
            </IconButton>
          </Box>
          <MattermostChat jwtToken={jwtToken} mattermostUrl={siteSettings['chat-url']} loginId={userData?.email || ''} width="100%" height="100%" />
        </DraggableResizable>
      )}
    </>
  );
}

interface NavkitProps {
  client: Client
  appName?: string
  getTheme?: (theme: 'light' | 'dark') => void
  navbarColor?: string
  iconColor?: string
}

const Navkit = ({ client, getTheme, appName, navbarColor, iconColor }: NavkitProps) => {
  return (
    <NavkitProvider client={client} onThemeChange={getTheme} appName={appName} navbarColor={navbarColor} iconColor={iconColor}>
      <NavkitContent />
    </NavkitProvider>
  )
}

export default Navkit
