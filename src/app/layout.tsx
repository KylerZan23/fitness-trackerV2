import type React from "react"
// import "./globals.css"
// import { Inter } from "next/font/google"
// import { ThemeProvider } from "@/components/theme-provider"

// const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Minimal Layout Test",
  description: "Testing basic layout functionality.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <body className={inter.className}> */}
      <body>
        {/* <ThemeProvider attribute='class' defaultTheme='light' enableSystem> */}
          {children}
        {/* </ThemeProvider> */}
      </body>
    </html>
  )
}
