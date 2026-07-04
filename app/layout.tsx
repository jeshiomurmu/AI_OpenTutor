import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AI Tutor - Learn Smarter with Socratic AI',
  description: 'The only AI tutor that asks YOU questions, detects knowledge gaps, breaks down complex problems, and catches misconceptions. Learn through guided discovery.',
  keywords: ['AI tutor', 'Socratic learning', 'knowledge gaps', 'problem solving', 'education', 'flashcards', 'quizzes', 'study'],
  authors: [{ name: 'AI Tutor Team' }],
  openGraph: {
    title: 'AI Tutor - Learn Smarter with Socratic AI',
    description: 'The only AI tutor that asks YOU questions, detects knowledge gaps, and breaks down complex problems.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Tutor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Tutor - Learn Smarter with Socratic AI',
    description: 'The only AI tutor that asks YOU questions, detects knowledge gaps, and breaks down complex problems.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
