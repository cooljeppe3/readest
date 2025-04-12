import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';
import i18n from 'i18next';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/hooks/useTranslation';
import { getStyles } from '@/utils/style';
import { saveViewSettings } from '../../utils/viewSettingsHelper';
import { TRANSLATED_LANGS } from '@/services/constants';
import cssbeautify from 'cssbeautify';
import cssValidate from '@/utils/css';
import DropDown from './DropDown';

const MiscPanel: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  // Get translation function
  const _ = useTranslation();
  // Access environment variables and app service
  const { envConfig, appService } = useEnv();
  // Access settings and font layout settings from the store
  const { settings, isFontLayoutSettingsGlobal, setSettings } = useSettingsStore();
  // Access view settings and functions from the reader store
  const { getView, getViewSettings, setViewSettings } = useReaderStore();
  // Retrieve view settings for the current book
  const viewSettings = getViewSettings(bookKey)!;

  // State for whether page turn animation is enabled
  const [animated, setAnimated] = useState(viewSettings.animated!);
  // State for whether click-to-flip is disabled
  const [isDisableClick, setIsDisableClick] = useState(viewSettings.disableClick!);
  // State for swapping the click-to-flip area
  const [swapClickArea, setSwapClickArea] = useState(viewSettings.swapClickArea!);
  // State for continuous scrolling mode
  const [isContinuousScroll, setIsContinuousScroll] = useState(viewSettings.continuousScroll!);
  // State for the current custom CSS stylesheet draft
  const [draftStylesheet, setDraftStylesheet] = useState(viewSettings.userStylesheet!);
  // State to track if the custom CSS stylesheet draft has been saved
  const [draftStylesheetSaved, setDraftStylesheetSaved] = useState(true);
  // State to track CSS validation errors
  const [error, setError] = useState<string | null>(null);

  // State to track if input is focused on Android
  const [inputFocusInAndroid, setInputFocusInAndroid] = useState(false);
  // Ref to the textarea element
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Handler for changes to the custom CSS stylesheet textarea
  const handleUserStylesheetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Get the current CSS input
    const cssInput = e.target.value;
    // Update the stylesheet draft state
    setDraftStylesheet(cssInput);
    // Mark the stylesheet as unsaved
    setDraftStylesheetSaved(false);

    // Validate the CSS input
    try {
      const { isValid, error } = cssValidate(cssInput);
      if (cssInput && !isValid) {
        throw new Error(error || 'Invalid CSS');
      }
      setError(null);
    // Catch CSS validation errors
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid CSS: Please check your input.');
      }
      console.log('CSS Error:', err);
    }
  };

  // Apply the current stylesheet to the book view
  const applyStyles = () => {
    // Format the CSS for better readability
    const formattedCSS = cssbeautify(draftStylesheet, {
      indent: '  ',
      openbrace: 'end-of-line',
      autosemicolon: true,
    });
    // Update the stylesheet with the formatted CSS
    setDraftStylesheet(formattedCSS);
    // Mark the stylesheet as saved
    setDraftStylesheetSaved(true);
    // Update the view settings with the new stylesheet
    viewSettings.userStylesheet = formattedCSS;
    setViewSettings(bookKey, { ...viewSettings });

    // If global font and layout settings are used, update them as well
    if (isFontLayoutSettingsGlobal) {
      settings.globalViewSettings.userStylesheet = formattedCSS;
      setSettings(settings);
    }

    // Apply the new styles to the book renderer
    getView(bookKey)?.renderer.setStyles?.(getStyles(viewSettings));
  };

  // Prevent input events from propagating further
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  // Handler for input focus
  const handleInputFocus = () => {
    if (appService?.isAndroidApp) {
      // Set the input as focused on Android
      setInputFocusInAndroid(true);
    }
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      });
    }, 300);
  };
  // Handler for input blur
  const handleInputBlur = () => {
    if (appService?.isAndroidApp) {
      setTimeout(() => {
        // Remove the input as focused on Android
        setInputFocusInAndroid(false);
      }, 100);
    }
  };

  // Get the currently selected UI language option
  const getCurrentUILangOption = () => {
    // Get the language code from settings
    const uiLanguage = viewSettings.uiLanguage;
    // Return the corresponding language label or 'Auto' if empty
    return {
      option: uiLanguage,
      label:
        uiLanguage === ''
          ? _('Auto')
          //get the translated label
          : TRANSLATED_LANGS[uiLanguage as keyof typeof TRANSLATED_LANGS],
    };
  };

  const getUILangOptions = () => {
    const langs = TRANSLATED_LANGS as Record<string, string>;
    const options = Object.entries(langs).map(([option, label]) => ({ option, label }));
    options.sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ option: '', label: _('Auto') });
    return options;
  };

  const handleSelectUILang = (option: string) => {
    saveViewSettings(envConfig, bookKey, 'uiLanguage', option, false, false);
    i18n.changeLanguage(option ? option : navigator.language);
    // Save the settings
  };

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'animated', animated, false, false);
    if (animated) {
      getView(bookKey)?.renderer.setAttribute('animated', '');
    } else {
      getView(bookKey)?.renderer.removeAttribute('animated');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'disableClick', isDisableClick, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDisableClick]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'swapClickArea', swapClickArea, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapClickArea]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'continuousScroll', isContinuousScroll, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isContinuousScroll]);

  return (
    <div
      className={clsx(
        'my-4 w-full space-y-6',
        inputFocusInAndroid && 'h-[50%] overflow-y-auto pb-[200px]',
      )}
    >
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Language')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Language')}</span>
              <DropDown
                selected={getCurrentUILangOption()}
                options={getUILangOptions()}
                onSelect={handleSelectUILang}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Animation')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Paging Animation')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={animated}
                onChange={() => setAnimated(!animated)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Behavior')}</h2>
        <div className='card border-base-200 bg-base-100 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Continuous Scroll')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={isContinuousScroll}
                onChange={() => setIsContinuousScroll(!isContinuousScroll)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Disable Click-to-Flip')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={isDisableClick}
                onChange={() => setIsDisableClick(!isDisableClick)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Swap Click-to-Flip Area')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={swapClickArea}
                disabled={isDisableClick}
                onChange={() => setSwapClickArea(!swapClickArea)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Custom CSS')}</h2>
        <div
          className={`card border-base-200 bg-base-100 border shadow ${error ? 'border-red-500' : ''}`}
        >
          <div className='relative p-1'>
            <textarea
              ref={textareaRef}
              className={clsx(
                'textarea textarea-ghost h-48 w-full border-0 p-3 text-base !outline-none sm:text-sm',
                'placeholder:text-base-content/70',
              )}
              placeholder={_('Enter your custom CSS here...')}
              spellCheck='false'
              value={draftStylesheet}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onInput={handleInput}
              onKeyDown={handleInput}
              onKeyUp={handleInput}
              onChange={handleUserStylesheetChange}
            />
            <button
              className={clsx(
                'btn btn-ghost bg-base-200 absolute bottom-2 right-4 h-8 min-h-8 px-4 py-2',
                draftStylesheetSaved ? 'hidden' : '',
                error ? 'btn-disabled' : '',
              )}
              onClick={applyStyles}
              disabled={!!error}
            >
              {_('Apply')}
            </button>
          </div>
        </div>
        {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
      </div>
    </div>
  );
};

export default MiscPanel;
