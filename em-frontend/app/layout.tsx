import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '7 Days to Calm - Elevated Movements',
  description: 'A guided mindfulness meditation challenge. Breathe, reset, rise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
