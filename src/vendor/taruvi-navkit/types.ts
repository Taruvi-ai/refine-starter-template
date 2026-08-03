import type { ReactNode } from "react"
import type { Client, Auth, UserData, UserRole } from "@taruvi/sdk"
import type { ThemeMode } from "./styles/variables"

export type { UserData, UserRole }

export interface AppData {
    appname: string,
    icon: string,
    url: string,
    id: string
}

export interface SiteSettings {
  shortcuts?: AppData[]
  logo?: string
  'show-chat': boolean
  'chat-url': string
  frontendUrl: string
  enableDarkMode: boolean
}

export interface AppSettings {
  displayName?: string
  icon?: string
  primaryColor?: string
  secondaryColor?: string
  frontendUrl?: string
}

export interface NavigationContextType {
  navigateToUrl: (url: string, openInLine: boolean) => void
  isDesk: boolean
  appsList: AppData[]
  userData: UserData | null
  siteSettings: SiteSettings
  appSettings: AppSettings
  appSettingsLoaded: boolean
  appName?: string
  jwtToken: string
  isUserAuthenticated: boolean
  client: Client
  auth: Auth
  themeMode: ThemeMode
  toggleTheme: () => void
  navbarColor?: string
  iconColor?: string
}

export interface NavkitProviderProps {
  children: ReactNode
  client: Client
  onThemeChange?: (theme: ThemeMode) => void
  appName?: string
  navbarColor?: string
  iconColor?: string
}
