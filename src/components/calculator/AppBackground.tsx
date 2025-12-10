'use client'

export function AppBackground() {
  return (
    <>
      {/* Gradient orbs - создают глубину */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-secondary/10 rounded-full blur-[100px] pointer-events-none" />
    </>
  )
}
