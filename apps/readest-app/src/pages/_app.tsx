// Import necessary modules from Next.js and the project's components.
import { AppProps } from 'next/app';
import Head from 'next/head';
import Providers from '@/components/Providers';

// Import global styles for the application.
import '../styles/globals.css';
import '../styles/fonts.css';

// Define the main application component using Next.js's MyApp pattern.
function MyApp({ Component, pageProps }: AppProps) {
  // The MyApp component renders the base structure for all pages in the application.
  // It includes a Head component for metadata and a Providers component to wrap all children with necessary contexts.
  return (
    <>
      {/*
        The Head component is used to manage metadata for the application, such as:
        - viewport settings for responsiveness
        - application name and Apple mobile web app settings
        - description for SEO and sharing
        - theme color and manifest file link
      */}
      <Head>
        <meta
          // Configures the viewport for responsive design.
          name='viewport'
          content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover'
        />
        <meta name='application-name' content='Readest' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Readest' />
        <meta
          name='description'
          content='Readest is an open-source eBook reader supporting EPUB, PDF, and sync across devices.'
        />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='theme-color' content='white' />
        <link rel='manifest' href='/manifest.json' />
      </Head>
      <Providers>
        {/*
          The Providers component wraps all page content, providing access to shared contexts like theme, auth, and environment.
          The Component is a dynamic component that changes based on the current route.
          The pageProps are data passed from the getStaticProps or getServerSideProps methods in page components.
        */}
        <Component {...pageProps} />
      </Providers>
    </>
  );
}
// Export the MyApp component as the default export.
export default MyApp;
