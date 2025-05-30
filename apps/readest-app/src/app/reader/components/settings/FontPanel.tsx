import clsx from 'clsx';
import React, { useEffect, useState } from 'react';


import {
  ANDROID_FONTS,
  CJK_FONTS_PATTENS,
  CJK_NAMES_PATTENS,
  IOS_FONTS,
  LINUX_FONTS,
  MACOS_FONTS,
  MONOSPACE_FONTS,
  SANS_SERIF_FONTS,
  SERIF_FONTS,
  WINDOWS_FONTS,
} from '@/services/constants';
import { useReaderStore } from '@/store/readerStore';
import { useTranslation } from '@/hooks/useTranslation';
// Context hook to get environment-related configurations.
import { useEnv } from '@/context/EnvContext';
import { getOSPlatform, isCJKEnv } from '@/utils/misc';
import { getSysFontsList } from '@/utils/font';
import { isTauriAppPlatform } from '@/services/environment';
import { saveViewSettings } from '../../utils/viewSettingsHelper';
import NumberInput from './NumberInput';
import FontDropdown from './FontDropDown';

// Define the properties for the FontFace component.
interface FontFaceProps {
  className?: string;
  family: string;
  label: string;
  options: string[];
  moreOptions?: string[];
  selected: string;
  onSelect: (option: string) => void;
}

// Function to generate the font family string for font-face rules.
const handleFontFaceFont = (option: string, family: string) => {
  return `'${option}', ${family}`;
};

// FontFace component to render a single font face configuration.
const FontFace = ({
  className,
  family,
  label,
  options,
  moreOptions,
  selected,
  onSelect,
}: FontFaceProps) => {
  // Use the translation hook for localization.
  const _ = useTranslation();
  return (
    <div className={clsx('config-item', className)}>
      <span className=''>{label}</span>
      <FontDropdown
        family={family}
        options={options.map((option) => ({ option, label: _(option) }))}
        moreOptions={moreOptions?.map((option) => ({ option, label: option })) ?? []}
        selected={selected}
        onSelect={onSelect}
        onGetFontFamily={handleFontFaceFont}
      />
    </div>
  );
};

// Main FontPanel component to manage all font settings.
const FontPanel: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  // Use the translation hook for localization.
  const _ = useTranslation();
  // Get environment configurations and app services.
  const { envConfig, appService } = useEnv();
  // Get view and view settings for the current book from the reader store.
  const { getView, getViewSettings } = useReaderStore();
  const viewSettings = getViewSettings(bookKey)!;
  const view = getView(bookKey)!;

  const fontFamilyOptions = [
    {
      // Option for Serif font.
      option: 'Serif',
      label: _('Serif Font'),
    },
    {
      option: 'Sans-serif',
      label: _('Sans-Serif Font'),
    },
  ];

  // Determine the OS platform to select the default system fonts.
  const osPlatform = getOSPlatform();
  let defaultSysFonts: string[] = [];
  // Set the default system fonts based on the OS platform.
  switch (osPlatform) {
    case 'macos':
      defaultSysFonts = MACOS_FONTS;
      break;
    case 'windows':
      defaultSysFonts = WINDOWS_FONTS;
      break;
    case 'linux':
      defaultSysFonts = LINUX_FONTS;
      break;
    case 'ios':
      defaultSysFonts = IOS_FONTS;
      break;
    case 'android':
      defaultSysFonts = ANDROID_FONTS;
      break;
    default:
      break;
  }
  // State variables to manage font settings.
  const [sysFonts, setSysFonts] = useState<string[]>(defaultSysFonts);
  const [defaultFontSize, setDefaultFontSize] = useState(viewSettings.defaultFontSize!);
  const [minFontSize, setMinFontSize] = useState(viewSettings.minimumFontSize!);
  const [overrideFont, setOverrideFont] = useState(viewSettings.overrideFont!);
  const [defaultFont, setDefaultFont] = useState(viewSettings.defaultFont!);
  const [defaultCJKFont, setDefaultCJKFont] = useState(viewSettings.defaultCJKFont!);
  const [serifFont, setSerifFont] = useState(viewSettings.serifFont!);
  const [sansSerifFont, setSansSerifFont] = useState(viewSettings.sansSerifFont!);
  const [monospaceFont, setMonospaceFont] = useState(viewSettings.monospaceFont!);
  const [fontWeight, setFontWeight] = useState(viewSettings.fontWeight!);

  // Effect to load system fonts if the app is a Tauri app.
  useEffect(() => {
    if (isTauriAppPlatform() && appService?.hasSysFontsList) {
      getSysFontsList().then((fonts) => {
        setSysFonts(fonts);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to save the default font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'defaultFont', defaultFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFont]);

  // Effect to save the default CJK font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'defaultCJKFont', defaultCJKFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCJKFont]);

  // Effect to save the default font size setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'defaultFontSize', defaultFontSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultFontSize]);

  // Effect to save the minimum font size setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'minimumFontSize', minFontSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minFontSize]);

  // Effect to save the font weight setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'fontWeight', fontWeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontWeight]);

  // Effect to save the serif font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'serifFont', serifFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serifFont]);

  // Effect to save the sans-serif font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'sansSerifFont', sansSerifFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sansSerifFont]);

  // Effect to save the monospace font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'monospaceFont', monospaceFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monospaceFont]);

  // Effect to save the override font setting.
  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'overrideFont', overrideFont);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideFont]);
  // Function to handle the font family based on the selected option.
  const handleFontFamilyFont = (option: string) => {
    switch (option) {
      case 'Serif':
        return `'${serifFont}', serif`;
      case 'Sans-serif':
        return `'${sansSerifFont}', sans-serif`;
      case 'Monospace':
        return `'${monospaceFont}', monospace`;
      default:
        return '';
    }
  };
  // Render the font panel settings.

  return (
    <div className='my-4 w-full space-y-6'>
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Font Size')}</h2>
        <div className='card border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <NumberInput
              label={_('Default Font Size')}
              value={defaultFontSize}
              onChange={setDefaultFontSize}
              min={minFontSize}
              max={120}
            />
            <NumberInput
              label={_('Minimum Font Size')}
              value={minFontSize}
              onChange={setMinFontSize}
              min={1}
              max={120}
            />
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Font Weight')}</h2>
        <div className='card border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <NumberInput
              label={_('Font Weight')}
              value={fontWeight}
              onChange={setFontWeight}
              min={100}
              max={900}
              step={100}
            />
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Font Family')}</h2>
        <div className='card border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Default Font')}</span>
              <FontDropdown
                options={fontFamilyOptions}
                selected={defaultFont}
                onSelect={setDefaultFont}
                onGetFontFamily={handleFontFamilyFont}
              />
            </div>

            {(isCJKEnv() || view?.language.isCJK) && (
              <FontFace
                className='config-item-top'
                family='serif'
                label={_('CJK Font')}
                options={sysFonts.filter(
                  (font) => CJK_FONTS_PATTENS.test(font) || CJK_NAMES_PATTENS.test(font),
                )}
                selected={defaultCJKFont}
                onSelect={setDefaultCJKFont}
              />
            )}

            <div className='config-item'>
              <span className=''>{_('Override Book Font')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={overrideFont}
                onChange={() => setOverrideFont(!overrideFont)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Font Face')}</h2>
        <div className='card border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <FontFace
              className='config-item-top'
              family='serif'
              label={_('Serif Font')}
              options={SERIF_FONTS}
              moreOptions={sysFonts}
              selected={serifFont}
              onSelect={setSerifFont}
            />
            <FontFace
              family='sans-serif'
              label={_('Sans-Serif Font')}
              options={SANS_SERIF_FONTS}
              moreOptions={sysFonts}
              selected={sansSerifFont}
              onSelect={setSansSerifFont}
            />
            <FontFace
              className='config-item-bottom'
              family='monospace'
              label={_('Monospace Font')}
              options={MONOSPACE_FONTS}
              moreOptions={sysFonts}
              selected={monospaceFont}
              onSelect={setMonospaceFont}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontPanel;
