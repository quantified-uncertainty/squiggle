import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fermi Model Competition Viewer',
  description: 'View and evaluate submissions for the Fermi Model Competition',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="bg-gray-800 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Fermi Contest</h1>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <a href="/" className="hover:text-blue-300">Home</a>
                  </li>
                  <li>
                    <a href="/submissions" className="hover:text-blue-300">Submissions</a>
                  </li>
                  <li>
                    <a href="/results" className="hover:text-blue-300">Results</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gray-100 py-4 mt-8">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} - Fermi Model Competition - QURI</p>
          </div>
        </footer>
      </body>
    </html>
  );
}