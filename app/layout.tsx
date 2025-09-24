import './globals.css'
import { ReactNode } from 'react'
import { ToastProvider } from '../components/Toast'

export const metadata = {
  title: 'NextApp — Chart Demo',
  description: 'A simple Next.js app showing a chart from in-memory data.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body>
        <ToastProvider>
          <main className="container">{children}</main>
        </ToastProvider>
        {/* Portal root for global toasts. Rendered server-side so client portals have a stable target. */}
        <div id="toast-root" />
      </body>
    </html>
  )
}
