import clsx from 'clsx';
import React, { useState, ChangeEvent, useEffect } from 'react';
import { MdPlayCircle, MdPauseCircle, MdFastRewind, MdFastForward, MdAlarm } from 'react-icons/md';
import { RiVoiceAiFill } from 'react-icons/ri'; // Icon for voice selection
import { MdCheck } from 'react-icons/md';
import { TTSVoice } from '@/services/tts';
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { TranslationFunc, useTranslation } from '@/hooks/useTranslation';
import { useSettingsStore } from '@/store/settingsStore';
import { useDefaultIconSize, useResponsiveSize } from '@/hooks/useResponsiveSize'; // For responsive icon sizes

// Define the type for the props of the TTSPanel component
type TTSPanelProps = {
  bookKey: string; // Key to identify the book for which TTS settings apply
  ttsLang: string; // Language code for TTS (e.g., 'en-US')
  isPlaying: boolean; // Flag to indicate if TTS is currently playing
  timeoutOption: number; // Currently selected timeout option (in seconds)
  timeoutTimestamp: number; // Timestamp representing the time when the timeout will occur
  onTogglePlay: () => void; // Callback to toggle the play/pause state of TTS
  onBackward: () => void; // Callback to rewind the TTS playback
  onForward: () => void; // Callback to fast-forward the TTS playback
  onSetRate: (rate: number) => void; // Callback to set the playback rate
  onGetVoices: (lang: string) => Promise<TTSVoice[]>; // Callback to fetch available TTS voices for a given language
  onSetVoice: (voice: string) => void; // Callback to set the selected TTS voice
  onGetVoiceId: () => string; // Callback to get the current voice ID
  onSelectTimeout: (value: number) => void; // Callback to handle the selection of a new timeout option
};

// Function to generate timeout options for the TTS playback
const getTTSTimeoutOptions = (_: TranslationFunc) => {
  return [
    {
      // Option: No Timeout
      label: _('No Timeout'),
      value: 0, // 0 represents no timeout
    },
    {
      // Option: 1 minute
      label: _('{{value}} minute', { value: 1 }),
      value: 60, // 60 seconds = 1 minute
    },
    {
      // Option: 3 minutes
      label: _('{{value}} minutes', { value: 3 }),
      value: 180, // 180 seconds = 3 minutes
    },
    {
      // Option: 5 minutes
      label: _('{{value}} minutes', { value: 5 }),
      value: 300, // 300 seconds = 5 minutes
    },
    {
      // Option: 10 minutes
      label: _('{{value}} minutes', { value: 10 }),
      value: 600, // 600 seconds = 10 minutes
    },
    {
      // Option: 20 minutes
      label: _('{{value}} minutes', { value: 20 }),
      value: 1200, // 1200 seconds = 20 minutes
    },
    {
      // Option: 30 minutes
      label: _('{{value}} minute', { value: 1 }),
      value: 60,
    },
    {
      label: _('{{value}} minutes', { value: 3 }),
      value: 180,
    },
    {
      label: _('{{value}} minutes', { value: 5 }),
      value: 300,
    },
    {
      label: _('{{value}} minutes', { value: 10 }),
      value: 600,
    },
    {
      label: _('{{value}} minutes', { value: 20 }),
      value: 1200,
    },
    {
      label: _('{{value}} minutes', { value: 30 }),
      value: 1800,
    },
    {
      label: _('{{value}} minutes', { value: 45 }),
      value: 2700,
    },
    {
      label: _('{{value}} hour', { value: 1 }),
      value: 3600,
    },
    {
      label: _('{{value}} hours', { value: 2 }),
      value: 7200,
    },
    {
      label: _('{{value}} hours', { value: 3 }),
      value: 10800,
    },
    {
      label: _('{{value}} hours', { value: 4 }),
      value: 14400,
    },
    {
      label: _('{{value}} hours', { value: 6 }),
      value: 21600,
    },
    {
      label: _('{{value}} hours', { value: 8 }),
      value: 28800,
    },
  ];
};

// Function to calculate and format the remaining countdown time
const getCountdownTime = (timeout: number) => {
  const now = Date.now();
  if (timeout > now) {
    const remainingTime = Math.floor((timeout - now) / 1000);
    const minutes = Math.floor(remainingTime / 3600) * 60 + Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return '';
};

// TTSPanel component definition
const TTSPanel = ({
  bookKey,
  ttsLang,
  isPlaying,
  timeoutOption,
  timeoutTimestamp,
  onTogglePlay,
  onBackward,
  onForward,
  onSetRate,
  onGetVoices,
  onSetVoice,
  onGetVoiceId,
  onSelectTimeout,
}: TTSPanelProps) => {
  const _ = useTranslation(); // Translation function
  const { envConfig } = useEnv(); // Environment configuration
  const { getViewSettings, setViewSettings } = useReaderStore(); // Reader settings store
  const { settings, setSettings, saveSettings } = useSettingsStore(); // Global settings store
  const viewSettings = getViewSettings(bookKey); // Get view settings for the current book

  // State for available TTS voices
  const [voices, setVoices] = useState<TTSVoice[]>([]); // Array of available voices
  // State for the current playback rate
  const [rate, setRate] = useState(viewSettings?.ttsRate ?? 1.0); // Default rate is 1.0
  // State for the selected voice
  const [selectedVoice, setSelectedVoice] = useState(viewSettings?.ttsVoice ?? ''); // Default voice is empty

  // State for the timeout countdown
  const [timeoutCountdown, setTimeoutCountdown] = useState(() => {
    return getCountdownTime(timeoutTimestamp); // Initialize countdown based on timeoutTimestamp
  });

  const defaultIconSize = useDefaultIconSize(); // Get default icon size
  const iconSize32 = useResponsiveSize(32); // Get responsive icon size for 32px
  const iconSize48 = useResponsiveSize(48); // Get responsive icon size for 48px

  // Handler for changing the playback rate
  const handleSetRate = (e: ChangeEvent<HTMLInputElement>) => {
    let newRate = parseFloat(e.target.value);
    // Ensure the rate is within the valid range [0.2, 3.0]
    newRate = Math.max(0.2, Math.min(3.0, newRate));
    setRate(newRate);
    onSetRate(newRate);
    const viewSettings = getViewSettings(bookKey)!;
    viewSettings.ttsRate = newRate;
    settings.globalViewSettings.ttsRate = newRate;
    setViewSettings(bookKey, viewSettings);
    setSettings(settings);
    saveSettings(envConfig, settings);
  };

  // Handler for selecting a different TTS voice
  const handleSelectVoice = (voice: string) => {
    onSetVoice(voice);
    setSelectedVoice(voice);
    const viewSettings = getViewSettings(bookKey)!;
    viewSettings.ttsVoice = voice;
    setViewSettings(bookKey, viewSettings);
  };

  // Function to update the timeout countdown
  const updateTimeout = (timeout: number) => {
    const now = Date.now();
    if (timeout > 0 && timeout < now) {
      onSelectTimeout(0);
      setTimeoutCountdown('');
    } else if (timeout > 0) {
      setTimeoutCountdown(getCountdownTime(timeout));
    }
  };

  // Effect to update the timeout countdown every second
  useEffect(() => {
    setTimeout(() => {
      updateTimeout(timeoutTimestamp);
    }, 1000);
  }, [timeoutTimestamp, timeoutCountdown]);

  // Effect to initialize the selected voice
  useEffect(() => {
    const voiceId = onGetVoiceId(); // Get the current voice ID
    setSelectedVoice(voiceId); // Set the selected voice to the current voice ID
  }, []);

  // Effect to fetch available TTS voices when the language changes
  useEffect(() => {
    const fetchVoices = async () => {
      const voices = await onGetVoices(ttsLang); // Fetch voices for the given language
      setVoices(voices); // Update the voices state
    };
    fetchVoices(); // Fetch voices on mount and when ttsLang changes
  }, [ttsLang]);

  // Get timeout options for the dropdown menu
  const timeoutOptions = getTTSTimeoutOptions(_); // Generate timeout options using the translation function

  // Render the TTS panel UI
  return (
    <div className='flex w-full flex-col items-center justify-center gap-2 rounded-2xl p-4'>
      <div className='flex w-full flex-col items-center gap-0.5'>
        <input
          className='range'
          type='range'
          min={0.0}
          max={3.0}
          step='0.1'
          value={rate}
          onChange={handleSetRate}
        />
        <div className='grid w-full grid-cols-7 text-xs'>
          {/* Visual indicators for the rate slider */}
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
          <span className='text-center'>|</span>
        </div>
        <div className='grid w-full grid-cols-7 text-xs'>
          {/* Labels for the rate slider */}
          <span className='text-center'>{_('Slow')}</span>
          <span className='text-center'></span>
          <span className='text-center'>1.0</span>
          <span className='text-center'>1.5</span>
          <span className='text-center'>2.0</span>
          <span className='text-center'></span>
          <span className='text-center'>{_('Fast')}</span>
        </div>
      </div>
      {/* Control buttons for TTS */}
      <div className='flex items-center justify-between space-x-2'>
        {/* Rewind button */}
        <button onClick={onBackward} className='rounded-full p-1'>
          <MdFastRewind size={iconSize32} />
        </button>
        {/* Play/Pause button */}
        <button onClick={onTogglePlay} className='rounded-full p-1'>
          {isPlaying ? (
            // Show pause icon when playing
            <MdPauseCircle size={iconSize48} className='fill-primary' />
          ) : (
            // Show play icon when paused
            <MdPlayCircle size={iconSize48} className='fill-primary' />
          )}
        </button>
        {/* Fast-forward button */}
        <button onClick={onForward} className='rounded-full p-1'>
          <MdFastForward size={iconSize32} />
        </button>
        <div className='dropdown dropdown-top'>
          <button className='flex flex-col items-center justify-center rounded-full p-1'>
            <MdAlarm size={iconSize32} />
            {timeoutCountdown && (
              <span
                className={clsx(
                  'absolute bottom-0 left-1/2 w-12 translate-x-[-50%] translate-y-[80%] px-1',
                  'bg-primary/80 text-base-100 rounded-full text-center text-xs',
                )}
              >
                {timeoutCountdown}
              </span>
            )}
          </button>
          {/* Timeout options dropdown */}
          <ul
            tabIndex={0}
            className={clsx(
              'dropdown-content bgcolor-base-200 no-triangle menu menu-vertical rounded-box absolute right-0 z-[1] shadow',
              'mt-4 inline max-h-96 w-[250px] overflow-y-scroll',
            )}
          >
            {timeoutOptions.map((option, index) => (
              <li key={`${index}-${option.value}`} onClick={() => onSelectTimeout(option.value)}>
                {/* Each timeout option */}
                <div className='flex items-center px-2'>
                  <span style={{ minWidth: `${defaultIconSize}px` }}>
                    {timeoutOption === option.value && <MdCheck className='text-base-content' />}
                  </span>
                  <span className={clsx('text-base sm:text-sm')}>{option.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {/* Voice selection dropdown */}
        <div className='dropdown dropdown-top'>
          {/* Voice selection button */}
          <button tabIndex={0} className='rounded-full p-1'>
            <RiVoiceAiFill size={iconSize32} />
          </button>
          {/* Dropdown menu for voice selection */}
          <ul
            tabIndex={0}
            className={clsx(
              'dropdown-content bgcolor-base-200 no-triangle menu menu-vertical rounded-box absolute right-0 z-[1] shadow',
              'mt-4 inline max-h-96 w-[250px] overflow-y-scroll',
            )}
          >
            {voices.map((voice, index) => (
              <li
                // Each voice option
                key={`${index}-${voice.id}`}
                onClick={() => !voice.disabled && handleSelectVoice(voice.id)}
              >
                <div className='flex items-center px-2'>
                  <span style={{ minWidth: `${defaultIconSize}px` }}>
                    {selectedVoice === voice.id && <MdCheck className='text-base-content' />}
                  </span>
                  <span className={clsx('text-base sm:text-sm', voice.disabled && 'text-gray-400')}>
                    {voice.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TTSPanel;
