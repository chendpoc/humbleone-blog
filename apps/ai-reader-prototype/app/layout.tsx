import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Builder Daily Prototype',
  description: 'Throwaway prototype for a three-pane AI information reader.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
