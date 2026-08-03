import { createContext, startTransition, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AppData, AppSettings, NavigationContextType, NavkitProviderProps, SiteSettings, UserData } from './types'
import type { ThemeMode } from './styles/variables'
import { User, Settings, Auth, App } from "@taruvi/sdk"
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'

const THEME_STORAGE_KEY = 'navkit-theme-mode'
const version = '0.0.47'

const getInitialTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  }
  return 'light'
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const NavkitProvider = ({ children, client, onThemeChange, appName, navbarColor, iconColor }: NavkitProviderProps) => {
  const auth = new Auth(client)

  const user = useRef<any>(null)
  const settings = useRef<any>(null)
  const siteSettings = useRef<SiteSettings>({
    shortcuts: [],
    logo: '',
    'show-chat': false,
    'chat-url': '',
    frontendUrl: '',
    enableDarkMode: false,
  })
  const [appSettings, setAppSettings] = useState<AppSettings>({})
  const [appSettingsLoaded, setAppSettingsLoaded] = useState<boolean>(false)

  const [isDesk, setIsDesk] = useState<boolean>(false)
  const [appsList, setAppsList] = useState<AppData[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [jwtToken, setJwtToken] = useState<string>('')
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme)

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => {
      const newMode = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(THEME_STORAGE_KEY, newMode)
      return newMode
    })
  }, [])

  const checkIfDesk = async () => {
    const frontendUrl = appSettings?.frontendUrl
    if (!frontendUrl) return false
    return window.location.href.includes(frontendUrl || '')
  }
  const navigateToUrl = (url: string, openInLine: boolean) => {
    if (isDesk && openInLine) {
      try {
        const urlObj = new URL(url)
        window.location.href = urlObj.pathname
      } catch {
        window.location.href = url.startsWith('/') ? url : `/${url}`
      }
    } else {
      window.open(url, "_blank")
    }
  }

  const authenticateUser = async () => {
    const authenticated = await auth.isUserAuthenticated()
    setIsUserAuthenticated(authenticated)
    getData(authenticated)

    // Get JWT token if authenticated from sdk
    if (authenticated) {
      const token = client.tokenClient.getToken() || ''
      setJwtToken(token)
    }
  }

  const getData = useCallback(async (isUserAuthenticated: boolean) => {
    user.current = new User(client)
    settings.current = new Settings(client)
    const fetchedSettings = await settings?.current?.get?.()

    // Fetch app settings to get the app name
    try {
      setAppSettingsLoaded(false)
      const { data } = await new App(client).settings().execute() as { data: { display_name?: string, icon?: string, primary_color?: string, secondary_color?: string, frontend_url?: string } }
      setAppSettings({
        displayName: appName || data?.display_name,
        icon: data?.icon,
        primaryColor: data?.primary_color,
        secondaryColor: data?.secondary_color,
        frontendUrl: data?.frontend_url
      })
    } catch {
      // App settings not available, continue without app settings
      setAppSettings({})
    } finally {
      setAppSettingsLoaded(true)
    }

    const rawSettings = (fetchedSettings?.data ?? fetchedSettings)?.settings ?? {}
    siteSettings.current = {
      ...siteSettings.current,
      'show-chat': rawSettings['navkit.show-chat'] ?? false,
      'chat-url': rawSettings['navkit.chat-url'] ?? '',
      frontendUrl: rawSettings['navkit.frontend-url'] ?? '',
      logo: rawSettings['navkit.logo'] ?? '',
      enableDarkMode: rawSettings['navkit.enable-dark-mode'] ?? false,
    }
    if (isUserAuthenticated) {
      const userDataResponse = await auth.getCurrentUser()
      setUserData(userDataResponse?.data || null)

      // Fetch user apps using username from userData
      if (userDataResponse?.data?.username) {
        const appsResponse = await user.current.getUserApps?.(userDataResponse.data.username)
        // Transform API response to match AppData interface
        const transformedApps: AppData[] = (appsResponse?.data || []).map?.((app: any) => ({
          id: app.slug,
          appname: app.display_name || app.name,
          icon: app.icon || "",
          url: app.url
        }))
        startTransition(() => {
          setAppsList(transformedApps)
        })
      }
    }

  }, [appName, client])

  useLayoutEffect(() => {
    console.log(`Taruvi Navkit v${version} initialized`)
    const init = async () => {
      library.add(fas, far)
      await authenticateUser()
    }
    init()
  }, [])

  // Listen for user profile updates via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('taruvi-updates')

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'refreshNavkit') {
        getData(isUserAuthenticated)
      }
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [getData, isUserAuthenticated])

  useEffect(() => {
    const initIsDesk = async () => {
      const isDeskValue = await checkIfDesk()
      setIsDesk(isDeskValue)
    }

    initIsDesk()
  }, [checkIfDesk])

  // Notify parent app of theme changes
  useEffect(() => {
    onThemeChange?.(themeMode)
  }, [themeMode, onThemeChange])

  return (
    <NavigationContext.Provider value={{ navigateToUrl, isDesk, appsList, userData, siteSettings: siteSettings.current, appSettings, appSettingsLoaded, appName, jwtToken, isUserAuthenticated, client, auth, themeMode, toggleTheme, navbarColor, iconColor }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavkitProvider')
  }
  return context
}
