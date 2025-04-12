import React, { useEffect, useRef, useState } from 'react';
import { Position } from '@/utils/sel';
import Popup from '@/components/Popup';
// Define the type for a definition, which can include a definition string and optional examples.
type Definition = {
  definition: string;
  examples?: string[];
};

// Define the type for a result, which includes the part of speech, definitions, and language.
type Result = {
  partOfSpeech: string;
  definitions: Definition[];
  language: string;
};

// Define the props interface for the WiktionaryPopup component.
interface WiktionaryPopupProps {
  // The word to lookup in Wiktionary.
  word: string;
  // Optional language code to filter definitions by language.
  lang?: string;
  // The position of the popup on the screen.
  position: Position;
  // The position of the triangle that points to the selected text.
  trianglePosition: Position;
  // The width of the popup.
  popupWidth: number;
  // The height of the popup.
  popupHeight: number;
}

// WiktionaryPopup component: Displays definitions fetched from Wiktionary.
const WiktionaryPopup: React.FC<WiktionaryPopupProps> = ({
  word,
  lang,
  position,
  trianglePosition,
  popupWidth,
  popupHeight
}) => {
  // State to keep track of the word being looked up.
  const [lookupWord, setLookupWord] = useState(word);
  // Ref to determine if a lookup is in progress, preventing multiple fetches.
  const isLookingUp = useRef(false);

  // Intercepts dictionary links and attaches an event listener to handle navigation.
  const interceptDictLinks = (definition: string): HTMLElement[] => {
    const container = document.createElement('div');
    container.innerHTML = definition;

    const links = container.querySelectorAll<HTMLAnchorElement>('a[rel="mw:WikiLink"]');

    links.forEach((link) => {
      const title = link.getAttribute('title');
      if (title) {
        link.addEventListener('click', (event) => {
          event.preventDefault();
          setLookupWord(title);
          isLookingUp.current = false;
        });

        link.className = 'text-primary underline cursor-pointer';
      }
    });

    return Array.from(container.childNodes) as HTMLElement[];
  };

  // Effect hook to fetch and display definitions.
  useEffect(() => {
    // If a lookup is already in progress, don't initiate a new one.
    if (isLookingUp.current) {
      return;
    }
    // Mark that a lookup is now in progress.
    isLookingUp.current = true;
    // Get references to the main and footer elements of the popup.
    const main = document.querySelector('main') as HTMLElement;
    const footer = document.querySelector('footer') as HTMLElement;

    // Function to fetch definitions for a given word and language.
    const fetchDefinitions = async (word: string, language?: string) => {
      // Clear previous content and set the loading state.
      main.innerHTML = '';
      footer.dataset.state = 'loading';

      try {
        const response = await fetch(
          `https://en.wiktionary.org/api/rest_v1/page/definition/${word}`,
        );
        if (!response.ok) {
          throw new Error('Failed to fetch definitions');
        }

        // Parse the JSON response and extract definitions.
        const json = await response.json();
        const results: Result[] | undefined = language
          ? json[language] || json['en']
          : json[Object.keys(json)[0]!];

        if (!results || results.length === 0) {
          throw new Error('No results found');
        }

        // Create and append the word header and language information.
        const hgroup = document.createElement('hgroup');
        const h1 = document.createElement('h1');
        h1.innerText = word;
        h1.className = 'text-lg font-bold';

        const p = document.createElement('p');
        p.innerText = results[0]!.language;
        p.className = 'text-sm italic opacity-75';
        hgroup.append(h1, p);
        main.append(hgroup);

        // Process and display each definition.
        results.forEach(({ partOfSpeech, definitions }: Result) => {
          const h2 = document.createElement('h2');
          h2.innerText = partOfSpeech;
          h2.className = 'text-base font-semibold mt-4';

          const ol = document.createElement('ol');
          ol.className = 'pl-8 list-decimal';

          definitions.forEach(({ definition, examples }: Definition) => {
            if (!definition) return;
            const li = document.createElement('li');
            const processedContent = interceptDictLinks(definition);
            li.append(...processedContent);

            if (examples) {
              const ul = document.createElement('ul');
              ul.className = 'pl-8 list-disc text-sm italic opacity-75';

              examples.forEach((example) => {
                const exampleLi = document.createElement('li');
                exampleLi.innerHTML = example;
                ul.appendChild(exampleLi);
              });

              li.appendChild(ul);
            }

            ol.appendChild(li);
          });

          main.appendChild(h2);
          main.appendChild(ol);
        });

        footer.dataset.state = 'loaded';
      } catch (error) {
        console.error(error);
        // Handle errors and display an error message.
        footer.dataset.state = 'error';
        
        const div = document.createElement('div');
        div.className =
          'flex flex-col items-center justify-center w-full h-full text-center absolute inset-0';

        const h1 = document.createElement('h1');
        h1.innerText = 'Error';
        h1.className = 'text-lg font-bold';

        const p = document.createElement('p');
        p.innerHTML = `Unable to load the word. Try searching directly on <a href="https://en.wiktionary.org/w/index.php?search=${encodeURIComponent(
          word,
        )}" target="_blank" rel="noopener noreferrer" class="text-primary underline">Wiktionary</a>.`;

        div.append(h1, p);
        main.append(div);
      }
    };

    // Determine the language code to use for fetching definitions.
    const langCode = typeof lang === 'string' ? lang : lang?.[0];
    // Call the fetchDefinitions function to start the process.
    fetchDefinitions(lookupWord, langCode);
  }, [lookupWord, lang]);

  // Render the WiktionaryPopup component.
  return (
    <div>
      <Popup
        trianglePosition={trianglePosition}
        width={popupWidth}
        height={popupHeight}
        position={position}
        className='select-text'
      >
        <div className='flex h-full flex-col'>
          {/* Main area to display the definitions. */}
          <main className='flex-grow overflow-y-auto p-4 font-sans' />
          <footer className='mt-auto hidden data-[state=loaded]:block data-[state=error]:hidden data-[state=loading]:hidden'>
            <div className='flex items-center px-4 py-2 text-sm opacity-60'>
              Source: Wiktionary (CC BY-SA)
            </div>
          </footer>
        </div>
      </Popup>
    </div>
  );
};

export default WiktionaryPopup;
