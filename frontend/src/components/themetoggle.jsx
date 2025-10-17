import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"


export default function ThemeToggle() {
  const [theme, setTheme] = useState("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Detectar tema del sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const systemTheme = prefersDark ? "dark" : "light"
    
    setTheme(systemTheme)
    document.documentElement.classList.toggle("dark", systemTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Evitar flash de contenido
  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl z-50 hover:scale-110 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 text-gray-800" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  )
}