import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';

export const metadata: Metadata = {
  title: 'Nexus One — The Business Operating System',
  description: 'Plataforma integral de gestión empresarial para PYMES.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Nexus One', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// Evita el flash de tema: aplica la clase 'dark' antes del primer paint.
const themeScript = `
(function(){try{var t=localStorage.getItem('nexus_theme');var d=t? t==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
