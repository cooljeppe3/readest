// Importing necessary modules and components from React and the project's utilities and contexts.
import React, { useEffect, useState } from 'react';
import Popup from '@/components/Popup';
import { Position } from '@/utils/sel';
import { getAPIBaseUrl } from '@/services/environment';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';

// Define the available languages for translation in a key-value format.
  AUTO: 'Auto Detect',
  EN: 'English',
  DE: 'German',
  FR: 'French',
  ES: 'Spanish',
  IT: 'Italian',
  EL: 'Greek',
  PT: 'Portuguese',
  NL: 'Dutch',
  PL: 'Polish',
  UK: 'Ukrainian',
  RU: 'Russian',
  AR: 'Arabic',
  TR: 'Turkish',
  ID: 'Indonesian',
  KO: 'Korean',
  JA: 'Japanese',
  'ZH-HANS': 'Chinese (Simplified)',
  'ZH-HANT': 'Chinese (Traditional)',
};

// Construct the API endpoint for DeepL translation service.
const DEEPL_API_ENDPOINT = getAPIBaseUrl() + '/deepl/translate';

// Define the props interface for the DeepLPopup component.
interface DeepLPopupProps {
  text: string; // The text to be translated.
  position: Position; // The position of the popup on the screen.
  trianglePosition: Position; // The position of the triangle pointer on the popup.
  popupWidth: number;
  popupHeight: number;
}

const DeepLPopup: React.FC<DeepLPopupProps> = ({
  text,
  position,
  trianglePosition,
  popupWidth,
  popupHeight,
}) => {
  // Use the translation hook for internationalization.
  const _ = useTranslation();
  // Access the authentication token from the AuthContext.
  const { token } = useAuth();
  // Access and manage the global settings from the settings store.
  const { settings, setSettings } = useSettingsStore();
  // State for the source language, defaulting to 'AUTO' for automatic detection.
  const [sourceLang, setSourceLang] = useState('AUTO');
  // State for the target language, initially set from user settings.
  const [targetLang, setTargetLang] = useState(settings.globalReadSettings.translateTargetLang);
  // State to hold the translated text.
  const [translation, setTranslation] = useState<string | null>(null);
  // State to store the detected source language when 'AUTO' is selected.
  const [detectedSourceLang, setDetectedSourceLang] = useState<keyof typeof LANGUAGES | null>(null);
  // State to track the loading status of the translation request.
  const [loading, setLoading] = useState(false);
  // State to hold any errors encountered during the translation process.
  const [error, setError] = useState<string | null>(null);

  // Event handler for source language selection changes.
  const handleSourceLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceLang(event.target.value);
  };

  const handleTargetLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    settings.globalReadSettings.translateTargetLang = event.target.value;
    setSettings(settings);
    setTargetLang(event.target.value);
  };

  // Effect hook to fetch the translation whenever the text, token, sourceLang, or targetLang changes.
  useEffect(() => {
    const fetchTranslation = async () => {
      setLoading(true);
      setError(null);
      setTranslation(null);

      try {
        // Make a POST request to the DeepL API endpoint.
        const response = await fetch(DEEPL_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token ?? ''}`,
          },
          body: JSON.stringify({
            text: [text],
            target_lang: targetLang.toUpperCase(),
            source_lang: sourceLang === 'AUTO' ? undefined : sourceLang.toUpperCase(),
          }),
        });

        // Throw an error if the response is not successful.
        if (!response.ok) {
          throw new Error('Failed to fetch translation');
        }
        // Parse the JSON response.
        const data = await response.json();
        // Extract the translated text and detected source language from the response.
        const translatedText = data.translations[0]?.text;
        const detectedSource = data.translations[0]?.detected_source_language;

        if (!translatedText) {
          throw new Error('No translation found');
        }

        if (sourceLang === 'AUTO' && detectedSource) {
          setDetectedSourceLang(detectedSource);
        }

        setTranslation(translatedText);
      } catch (err) {
        console.error(err);
        // Set error messages based on the presence of an authentication token.
        if (!token) {
          setError(_('Unable to fetch the translation. Please log in first and try again.'));
        } else {
          setError(_('Unable to fetch the translation. Try again later.'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTranslation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, token, sourceLang, targetLang]);

  // Render the DeepL translation popup.
  return (
    <div>
      <Popup
        trianglePosition={trianglePosition}
        //set the width and height of the popup
        width={popupWidth}
        height={popupHeight}
        position={position}
        className='select-text'
      >
        <div className='text-neutral-content relative h-[50%] overflow-y-auto border-b border-neutral-400/75 p-4 font-sans'>
          <div className='mb-2 flex items-center justify-between'>
            <h1 className='text-base font-semibold'>{_('Original Text')}</h1>
            <select
              value={sourceLang}
              onChange={handleSourceLangChange}
              // Styling for the select element.
              className='select text-neutral-content h-8 min-h-8 rounded-md border-none bg-neutral-200/50 text-sm focus:outline-none focus:ring-0'
            >
              {Object.entries(LANGUAGES).map(([code, name]) => {
                return (
                  <option key={code} value={code}>
                    {detectedSourceLang && sourceLang === 'AUTO' && code === 'AUTO'
                      ? `${LANGUAGES[detectedSourceLang] || detectedSourceLang} ` + _('(detected)')
                      : name}
                  </option>
                );
              })}
            </select>
          </div>
          <p className='text-base'>{text}</p>
        </div>

        <div className='text-neutral-content relative h-[50%] overflow-y-auto p-4 font-sans'>
          <div className='mb-2 flex items-center justify-between'>
            <h2 className='text-base font-semibold'>{_('Translated Text')}</h2>
            <select
              value={targetLang}
              onChange={handleTargetLangChange}
              // Styling for the select element.
              className='select text-neutral-content h-8 min-h-8 rounded-md border-none bg-neutral-200/50 text-sm focus:outline-none focus:ring-0'
            >
              {Object.entries(LANGUAGES)
                .filter(([code]) => code !== 'AUTO')
                .map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
            </select>
          </div>

          {loading ? (
            <p className='text-base italic text-gray-500'>{_('Loading...')}</p>
          ) : error ? (
            <p className='text-base text-red-600'>{error}</p>
          ) : (
            <div>
              <p className='text-base'>{translation || 'No translation available.'}</p>
              <div className='pt-4 text-sm opacity-60'>Translated by DeepL.</div>
            </div>
          )}
        </div>
      </Popup>
    </div>
  );
};

export default DeepLPopup;
