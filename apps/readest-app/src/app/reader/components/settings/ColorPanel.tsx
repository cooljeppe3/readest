// Import necessary React modules and hooks for managing state and side effects.
import React, { useState, useEffect } from 'react';
// Import icons from 'react-icons' for UI elements.
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md';
import { MdRadioButtonUnchecked, MdRadioButtonChecked } from 'react-icons/md';
import { CgColorPicker } from 'react-icons/cg';
import { TbSunMoon } from 'react-icons/tb';
import { PiPlus } from 'react-icons/pi';
// Import utility functions and types from '@/styles/themes' to manage themes.
import {
  applyCustomTheme,
  CustomTheme,
  generateDarkPalette,
  generateLightPalette,
  Theme,
  themes, // Array of predefined themes.
} from '@/styles/themes';
// Import custom hooks for accessing environment variables, settings, theme, translation and responsive size
import { useEnv } from '@/context/EnvContext';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore } from '@/store/themeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
// Import the ThemeEditor component for editing custom themes.
import ThemeEditor from './ThemeEditor';

// Define the ColorPanel component, a functional component that receives a bookKey prop.
const ColorPanel: React.FC<{ bookKey: string }> = ({}) => {
  // Initialize the translation hook to handle multilingual text.
  const _ = useTranslation();
  // Access theme settings and methods from the theme store.
  const { themeMode, themeColor, isDarkMode, setThemeMode, setThemeColor, saveCustomTheme } =
    useThemeStore();
  // Access environment configuration from the env context.
  const { envConfig } = useEnv();
  // Access global settings from the settings store.
  const { settings, setSettings } = useSettingsStore();

  // set icons sizes
  const iconSize16 = useResponsiveSize(16);
  const iconSize24 = useResponsiveSize(24);

  // State to manage the custom theme being edited, a list of custom themes, and the visibility of the theme editor.
  const [editTheme, setEditTheme] = useState<CustomTheme | null>(null);
  const [customThems, setCustomThemes] = useState<Theme[]>([]);
  const [showCustomThemeEditor, setShowCustomThemeEditor] = useState(false);

  useEffect(() => {
    const customThemes = settings.globalReadSettings.customThemes ?? [];
    setCustomThemes(
      // Map over custom themes, generating light and dark palettes for each theme.
      customThemes.map((customTheme) => ({
        name: customTheme.name,
        label: customTheme.label,
        colors: {
          light: generateLightPalette(customTheme.colors.light),
          dark: generateDarkPalette(customTheme.colors.dark),
        },
        isCustomizale: true,
      })),
    );
  }, [settings]);

  // Function to handle saving a custom theme.
  const handleSaveCustomTheme = (customTheme: CustomTheme) => {
    applyCustomTheme(customTheme);
    saveCustomTheme(envConfig, settings, customTheme);
    // Update settings and theme color.
    setSettings({ ...settings });
    setThemeColor(customTheme.name);
    setShowCustomThemeEditor(false);
  };
  // Function to delete a custom theme.
  const handleDeleteCustomTheme = (customTheme: CustomTheme) => {
    saveCustomTheme(envConfig, settings, customTheme, true);

    setSettings({ ...settings });
    setThemeColor('default');
    setShowCustomThemeEditor(false);
  };
  // Function to start editing a theme.
  const handleEditTheme = (name: string) => {
    const customTheme = settings.globalReadSettings.customThemes.find((t) => t.name === name);
    if (customTheme) {
      setEditTheme(customTheme);
      setShowCustomThemeEditor(true);
    }
  };

  // The render method of the ColorPanel component.
  return (
    // Main container for the color panel.
    <div className='my-4 w-full space-y-6'>
      {showCustomThemeEditor ? (
        <ThemeEditor
          customTheme={editTheme}
          onSave={handleSaveCustomTheme}
          onDelete={handleDeleteCustomTheme}
          onCancel={() => setShowCustomThemeEditor(false)}
        />
      ) : (
        // Content of the panel when not editing a theme.
        <>
          {/* Theme mode selection section */}
          <div className='flex items-center justify-between'>
            {/* Header for theme mode section. */}
            <h2 className='font-medium'>{_('Theme Mode')}</h2>
            <div className='flex gap-4'>
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Auto Mode')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${themeMode === 'auto' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setThemeMode('auto')}
                >
                  <TbSunMoon />
                </button>
              </div>
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Light Mode')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${themeMode === 'light' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setThemeMode('light')}
                >
                  <MdOutlineLightMode />
                </button>
              </div>
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Dark Mode')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${themeMode === 'dark' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setThemeMode('dark')}
                >
                  <MdOutlineDarkMode />
                </button>
              </div>
            </div>
          </div>
          {/* Theme color selection section */}
          <div>
            {/* Header for theme color section */}
            <h2 className='mb-2 font-medium'>{_('Theme Color')}</h2>
            {/* Grid of theme color options */}
            <div className='grid grid-cols-3 gap-4'>
              {/* Map over the available themes (default + custom). */}
              {themes.concat(customThems).map(({ name, label, colors, isCustomizale }) => (
                <label
                  key={name}
                  className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg p-4 shadow-md ${
                    themeColor === name ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                  style={{
                    // Dynamic background and text colors based on the theme and dark mode.
                    backgroundColor: isDarkMode
                      ? colors.dark['base-100']
                      : colors.light['base-100'],
                    color: isDarkMode ? colors.dark['base-content'] : colors.light['base-content'],
                  }}
                >
                  <input
                    type='radio'
                    name='theme'
                    value={name}
                    checked={themeColor === name}
                    onChange={() => setThemeColor(name)}
                    className='hidden'
                  />
                  {/* Show the checked or unchecked radio button based on the theme color. */}
                  {themeColor === name ? (
                    <MdRadioButtonChecked size={iconSize24} />
                  ) : (
                    <MdRadioButtonUnchecked size={iconSize24} />
                  )}
                  <span>{_(label)}</span>
                  {isCustomizale && themeColor === name && (
                    // Show the edit icon if the theme is customizable and selected.
                    <button onClick={() => handleEditTheme(name)}>
                      <CgColorPicker size={iconSize16} className='absolute right-2 top-2' />
                    </button>
                  )}
                </label>
              ))}
              <label
                // Custom theme creation button.
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 shadow-md`}
                onClick={() => setShowCustomThemeEditor(true)}
              >
                <PiPlus size={iconSize24} />
                <span>{_('Custom')}</span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
// Export the ColorPanel component for use in other parts of the application.
export default ColorPanel;

