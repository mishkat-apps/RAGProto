import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NECTA Textbook RAG',
  description: 'AI-powered textbook question answering for Tanzanian secondary education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
