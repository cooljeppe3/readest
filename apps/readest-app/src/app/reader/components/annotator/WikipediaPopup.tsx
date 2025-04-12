import React, { useEffect, useRef } from 'react'; // Importing React and necessary hooks
import Popup from '@/components/Popup';
import { Position } from '@/utils/sel';

/**
 * Interface defining the properties for the WikipediaPopup component.
 */
interface WikipediaPopupProps {
  text: string; // The text query to search on Wikipedia
  lang: string; // The language code for the Wikipedia article (e.g., 'en', 'es')
  position: Position; // The position where the popup should appear
  trianglePosition: Position; // The position of the triangle indicator on the popup
  popupWidth: number; // The width of the popup
  popupHeight: number; // The height of the popup
}

/**
 * WikipediaPopup component: Fetches and displays a Wikipedia summary for a given text query.
 * @param {WikipediaPopupProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered WikipediaPopup component.
 */
const WikipediaPopup: React.FC<WikipediaPopupProps> = ({
  text, // The text to search on Wikipedia
  lang, // Language code for Wikipedia
  position, // Position of the popup
  trianglePosition, // Position of the triangle indicator
  popupWidth, // Width of the popup
  popupHeight, // Height of the popup
}) => {
  const isLoading = useRef(false); // Ref to track if a fetch request is currently in progress

  /**
   * useEffect hook to handle the fetching and display of Wikipedia summary.
   * It runs whenever the 'text' or 'lang' prop changes.
   */
  useEffect(() => {
    // Prevent multiple simultaneous requests
    if (isLoading.current) {
      return;
    }
    isLoading.current = true; // Set loading state to true

    // Selectors to target the main and footer elements within the popup
    const main = document.querySelector('main') as HTMLElement;
    const footer = document.querySelector('footer') as HTMLElement;

    /**
     * Fetches the Wikipedia summary for a given query and language.
     * @param {string} query - The search query.
     * @param {string} language - The language code.
     */
    const fetchSummary = async (query: string, language: string) => {
      // Clear previous content and set footer to loading state
      main.innerHTML = '';
      footer.dataset['state'] = 'loading';

      try {
        // Fetch summary from Wikipedia REST API
        const response = await fetch(
          `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        );

        // Throw error if response is not ok
        if (!response.ok) {
          throw new Error('Failed to fetch Wikipedia summary');
        }

        /**
         * Process the response and generate the required HTML elements.
         * This includes creating an hgroup with title, description and image,
         * and a content div with the article's extract.
         */
        const data = await response.json();

        const hgroup = document.createElement('hgroup');
        hgroup.style.color = 'white';
        hgroup.style.backgroundPosition = 'center center';
        hgroup.style.backgroundSize = 'cover';
        hgroup.style.backgroundColor = 'rgba(0, 0, 0, .4)';
        hgroup.style.backgroundBlendMode = 'darken';
        hgroup.style.borderRadius = '6px';
        hgroup.style.padding = '12px';
        hgroup.style.marginBottom = '12px';
        hgroup.style.minHeight = '100px';

        // Create and append the article title
        const h1 = document.createElement('h1');
        h1.innerHTML = data.titles.display;
        h1.className = 'text-lg font-bold';
        hgroup.append(h1);

        if (data.description) {
          const description = document.createElement('p');
          description.innerText = data.description;
          hgroup.appendChild(description);
        }

        if (data.thumbnail) {
          hgroup.style.backgroundImage = `url("${data.thumbnail.source}")`;
        }

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = data.extract_html;
        contentDiv.className = 'p-2 text-sm';
        contentDiv.dir = data.dir;

        // Append the created elements to the main container
        main.append(hgroup, contentDiv);
        // Update the state to "loaded"
        footer.dataset['state'] = 'loaded';
      } catch (error) {
        console.error(error);

        // Handle errors by creating and appending error messages
        const errorDiv = document.createElement('div');

        const h1 = document.createElement('h1');
        h1.innerText = 'Error';

        const errorMsg = document.createElement('p');
        errorMsg.innerHTML = `Unable to load the article. Try searching directly on <a href="https://${language}.wikipedia.org/w/index.php?search=${encodeURIComponent(
          query,
        )}" target="_blank" rel="noopener noreferrer" class="text-primary underline">Wikipedia</a>.`;

        errorDiv.append(h1, errorMsg);
        main.appendChild(errorDiv);
        footer.dataset['state'] = 'error';
      } finally {
        isLoading.current = false; // Reset loading state
      }
    };
    // Extract the language code to build the API request
    const bookLang = typeof lang === 'string' ? lang : lang?.[0];
    const langCode = bookLang ? bookLang.split('-')[0]! : 'en';

    // Fetch the Wikipedia summary
    fetchSummary(text, langCode);
  }, [text, lang]); // Effect dependencies: re-run if 'text' or 'lang' change

  // Render the component
  return (
    // Main container
    <div>
      <Popup
        width={popupWidth}
        height={popupHeight}
        position={position}
        trianglePosition={trianglePosition}
        className='select-text'
      >
        {/* Content container */}
        <div className='text-base-content flex h-full flex-col pt-2'>
          {/* Main area to display article content */}
          <main className='flex-grow overflow-y-auto px-2 font-sans'></main>
          {/* Footer: will show the source when loading is done */}
          <footer className='mt-auto hidden data-[state=loaded]:block data-[state=error]:hidden data-[state=loading]:hidden'>
            <div className='flex items-center px-4 py-2 text-sm opacity-60'> 
              Source: Wikipedia (CC BY-SA)
            </div>
          </footer>
        </div>
      </Popup>
    </div>
  );
};

export default WikipediaPopup;
