import type { Metadata, Viewport } from "next";
import { Press_Start_2P, JetBrains_Mono, Silkscreen } from "next/font/google";
import "./globals.css";

// Arcade display font - for headers and emphasis
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Body font - readable monospace
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Accent font - for labels and UI elements
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-accent",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACE-IT | Arcade Study Assistant",
  description: "Level up your knowledge. AI-powered study assistant with quizzes, XP, and achievements.",
  keywords: ["study", "quiz", "AI", "learning", "education", "gamification"],
  authors: [{ name: "Ace-It" }],
  openGraph: {
    title: "ACE-IT | Arcade Study Assistant",
    description: "Level up your knowledge with AI-powered quizzes",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#00ffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${pressStart.variable}
          ${jetbrainsMono.variable}
          ${silkscreen.variable}
          font-body
          antialiased
        `}
      >
        {/* Main content wrapper with CRT effects - modals portal outside this */}
        <div className="retro-grid crt-overlay animate-crt-boot min-h-screen">
          {children}
        </div>
        {/* Portal root for modals - outside filtered content */}
        <div id="modal-root" />
      </body>
    </html>
  );
}
