
import { useEffect } from 'react';

export function useGoogleAnalytics() {
  useEffect(() => {
    // Only initialize if we're in production and have a valid domain
    if (process.env.NODE_ENV === 'production' && window.location.hostname !== 'localhost') {
      // Check if Google Analytics is already loaded
      if (!window.gtag) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-KHHWWVXH5S';
        document.head.appendChild(script);

        script.onload = () => {
          window.dataLayer = window.dataLayer || [];
          function gtag(...args: any[]) {
            window.dataLayer.push(args);
          }
          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', 'G-KHHWWVXH5S', {
            // Configure to only use first-party cookies
            cookie_domain: 'auto',
            cookie_flags: 'SameSite=None;Secure',
          });
        };
      }
    }
  }, []);
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}
