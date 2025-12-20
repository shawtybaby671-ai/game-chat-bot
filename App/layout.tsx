import './globals.css';

export const metadata = {
  title: 'DegenFamous Bingo',
  description: 'Group chat bingo with neon vibes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
