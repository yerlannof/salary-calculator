'use client'
import { useTheme } from "@/components/theme/ThemeProvider"
import { motion } from 'framer-motion'
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 bg-bg-secondary rounded-full p-1 transition-colors border border-border-subtle"
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-6 h-6 bg-gradient-accent rounded-full shadow-medium flex items-center justify-center"
        animate={{ x: theme === 'dark' ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-white" />
        ) : (
          <Sun className="w-3 h-3 text-white" />
        )}
      </motion.div>
    </button>
  )
}
