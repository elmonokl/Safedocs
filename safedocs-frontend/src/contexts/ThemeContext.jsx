import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return ctx
}

const DEFAULT_SIDEBAR = '#38BDF8' // sky-400 (celeste pastel)

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('sd_dark') === '1')
  const [sidebarColor, setSidebarColor] = useState(() => localStorage.getItem('sd_sidebar') || DEFAULT_SIDEBAR)

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('sd_dark', '1')
    } else {
      root.classList.remove('dark')
      localStorage.removeItem('sd_dark')
    }
  }, [dark])

  useEffect(() => {
    localStorage.setItem('sd_sidebar', sidebarColor)
  }, [sidebarColor])

  const value = useMemo(() => ({
    dark,
    setDark,
    sidebarColor,
    setSidebarColor,
    resetSidebar: () => setSidebarColor(DEFAULT_SIDEBAR)
  }), [dark, sidebarColor])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}


