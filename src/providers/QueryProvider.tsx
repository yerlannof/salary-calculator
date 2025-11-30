"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные считаются свежими 5 минут
            staleTime: 5 * 60 * 1000,
            // Кэш хранится 30 минут
            gcTime: 30 * 60 * 1000,
            // Не рефетчить при фокусе окна (для мобилок)
            refetchOnWindowFocus: false,
            // Повторять при ошибке 1 раз
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
