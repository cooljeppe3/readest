import * as React from 'react';
import Providers from '@/components/Providers';

// Import global styles for the application.
import '../styles/globals.css';
import '../styles/fonts.css';

// Define constants for the application's metadata.
const url = 'https://web.readest.com/';
const title = 'Readest — Where You Read, Digest and Get Insight';
const description =
  'Discover Readest, the ultimate online ebook reader for immersive and organized reading. ' +
  'Enjoy seamless access to your digital library, powerful tools for highlighting, bookmarking, ' +
  'and note-taking, and support for multiple book views. ' +
  'Perfect for deep reading, analysis, and understanding. Explore now!'; // Description of the application.
const previewImage = 'https://cdn.readest.com/images/open_graph_preview_read_now.png';

// Define metadata for the entire application. This is used by search engines and social media platforms.
export const metadata = {
  title, // The title of the application.
  description, // The description of the application.
  generator: 'Next.js', // Indicates that the site is built with Next.js.

  // Web App Manifest
  // The manifest provides metadata about a web application, such as its name, icons, and theme color.
  // It's used for installing the web app as a PWA (Progressive Web App).
  manifest: '/manifest.json',
  keywords: ['epub', 'pdf', 'ebook', 'reader', 'readest', 'pwa'],
  authors: [
    {
      name: 'readest',
      url: 'https://github.com/readest/readest',
    },
  ],
  // Icons configuration
  // Specifies the different icons used by the application, such as apple-touch-icon and regular icon.
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', url: '/icon.png' },
  ],
};

// Configure the viewport settings for the application.
export const viewport = {
  width: 'device-width', // Sets the width of the viewport to the device's width.
  initialScale: 1, // Sets the initial zoom level when the page is loaded.
  maximumScale: 1, // Prevents the user from zooming in further than 100%.
  userScalable: false, // Disables user zoom.
  viewportFit: 'cover', // Ensures the web content fills the entire viewport.
  themeColor: 'white', // Sets the theme color for the browser UI.
};

// The root layout component for the entire application.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* Set the title of the page */}
        <title>{title}</title> 
        
        {/* Viewport meta tag for responsive design */}
        {/* This tag controls how the page is displayed on different devices. */}
        <meta
          name='viewport'
          content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
        />
        {/* Meta tags for mobile web app capability */}
        {/* These tags enable the app to be saved to the home screen and run like a native app. */}
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Readest' />
        
        {/* Links for various icons and manifest */}
        {/* These provide the necessary resources for the app to look good when installed or added to the home screen. */}
        
        {/* Provides the web app manifest */}
        <link rel='manifest' href='/manifest.json' />

        {/* Favicon and apple touch icon */}
        <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
        <link rel='icon' href='/favicon.ico' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='description' content={description} />
        <meta property='og:url' content={url} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:image' content={previewImage} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta property='twitter:domain' content='web.readest.com' />
        <meta property='twitter:url' content={url} />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        <meta name='twitter:image' content={previewImage} />
      </head>
      {/* Body of the page */}
      <body>
        {/* The Providers component wraps the entire application and provides various contexts and providers. */}
        <Providers>{children}</Providers>
      </body>
      {/* The body contains the main content of the application, which is passed in as a child. */}
    </html>
  );
}
