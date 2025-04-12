// Import necessary modules and components from external libraries and local files.
import clsx from 'clsx';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEnv } from '@/context/EnvContext';
import { useBookDataStore } from '@/store/bookDataStore';
import { useReaderStore } from '@/store/readerStore';
// Import custom hook for translations.
import { useTranslation } from '@/hooks/useTranslation';
// Import custom hook for responsive sizing.
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
// Import TTSController and silence data for audio.
import { TTSController, SILENCE_DATA } from '@/services/tts';
// Import utility functions for calculating popup positions and handling events.
import { getPopupPosition, Position } from '@/utils/sel';
import { eventDispatcher } from '@/utils/event';
import { parseSSMLLang } from '@/utils/ssml';
import { getOSPlatform } from '@/utils/misc';
import { throttle } from '@/utils/throttle';
import { invokeUseBackgroundAudio } from '@/utils/bridge';
// Import the Popup component for displaying the TTS panel.
import Popup from '@/components/Popup';
// Import the TTSPanel and TTSIcon components.
import TTSPanel from './TTSPanel';
import TTSIcon from './TTSIcon';

// Define constants for the width, height, and padding of the TTS popup panel.
const POPUP_WIDTH = 282;
const POPUP_HEIGHT = 160;
const POPUP_PADDING = 10;

/**
 * TTSControl Component
 *
 * This component provides controls for Text-to-Speech (TTS) functionality within the application.
 * It manages the state of TTS playback, including play/pause, rate adjustment, and voice selection.
 */
const TTSControl = () => {
  const _ = useTranslation();
  const { appService } = useEnv();
  const { getBookData } = useBookDataStore();
  const { getView, getViewSettings } = useReaderStore();
  const [bookKey, setBookKey] = useState<string>('');
  const [ttsLang, setTtsLang] = useState<string>('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [panelPosition, setPanelPosition] = useState<Position>();
  const [trianglePosition, setTrianglePosition] = useState<Position>();

  // State variables for managing timeouts.
  const [timeoutOption, setTimeoutOption] = useState(0);
  const [timeoutTimestamp, setTimeoutTimestamp] = useState(0);
  const [timeoutFunc, setTimeoutFunc] = useState<ReturnType<typeof setTimeout> | null>(null);

  const popupWidth = useResponsiveSize(POPUP_WIDTH);
  const popupHeight = useResponsiveSize(POPUP_HEIGHT);
  const popupPadding = useResponsiveSize(POPUP_PADDING);

  const iconRef = useRef<HTMLDivElement>(null);
  // Reference to the TTSController instance.
  const ttsControllerRef = useRef<TTSController | null>(null);
  // Reference to an audio element used to unblock audio playback.
  const unblockerAudioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * unblockAudio
   *
   * Enables WebAudio to play even when the mute toggle switch is ON.
   */
  const unblockAudio = () => {
    if (unblockerAudioRef.current) return;
    unblockerAudioRef.current = document.createElement('audio');
    unblockerAudioRef.current.setAttribute('x-webkit-airplay', 'deny');
    unblockerAudioRef.current.preload = 'auto';
    unblockerAudioRef.current.loop = true;
    unblockerAudioRef.current.src = SILENCE_DATA;
    unblockerAudioRef.current.play();
  };

  /**
   * releaseUnblockAudio
   *
   * Releases the unblock audio element, stopping playback and removing it from memory.
   */
  const releaseUnblockAudio = () => {
    if (!unblockerAudioRef.current) return;
    try {
      unblockerAudioRef.current.pause();
      unblockerAudioRef.current.currentTime = 0;
      unblockerAudioRef.current.removeAttribute('src');
      unblockerAudioRef.current.src = '';
      unblockerAudioRef.current.load();
      unblockerAudioRef.current = null;
      console.log('Unblock audio released');
    } catch (err) {
      console.warn('Error releasing unblock audio:', err);
    }
  };

  /**
   * useEffect Hook
   * Cleans up the TTS controller when the component unmounts.
   */
  useEffect(() => {
    return () => {
      if (ttsControllerRef.current) {
        ttsControllerRef.current.kill();
        ttsControllerRef.current = null;
      }
    };
  }, []);

  /**
   * useEffect Hook
   * Subscribes to events related to TTS operations.
   */
  useEffect(() => {
    eventDispatcher.on('tts-speak', handleTTSSpeak);
    eventDispatcher.on('tts-stop', handleTTSStop);
    eventDispatcher.onSync('tts-is-speaking', handleQueryIsSpeaking);
    return () => {
      eventDispatcher.off('tts-speak', handleTTSSpeak);
      eventDispatcher.off('tts-stop', handleTTSStop);
      eventDispatcher.offSync('tts-is-speaking', handleQueryIsSpeaking);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * handleTTSSpeak
   *
   * Initiates TTS playback for a given book and range.
   * @param event - The custom event containing bookKey and range.
   */
  const handleTTSSpeak = async (event: CustomEvent) => {
    const { bookKey, range } = event.detail;
    const view = getView(bookKey);
    const viewSettings = getViewSettings(bookKey);
    const bookData = getBookData(bookKey);
    if (!view || !viewSettings || !bookData) return;
    if (bookData.book?.format === 'PDF') {
      eventDispatcher.dispatch('toast', {
        message: _('TTS not supported for PDF'),
        type: 'warning',
      });
      return;
    }

    setBookKey(bookKey);

    if (ttsControllerRef.current) {
      ttsControllerRef.current.stop();
      ttsControllerRef.current = null;
    }
    setShowIndicator(true);

    try {
      if (appService?.isIOSApp) {
        await invokeUseBackgroundAudio({ enabled: true });
      }
      if (getOSPlatform() === 'ios' || appService?.isIOSApp) {
        unblockAudio();
      }
      const ttsController = new TTSController(view);
      await ttsController.init();
      await ttsController.initViewTTS();
      const ssml = view.tts?.from(range);
      if (ssml) {
        const lang = parseSSMLLang(ssml) || 'en';
        setTtsLang(lang);
        setIsPlaying(true);

        ttsController.setLang(lang);
        ttsController.setRate(viewSettings.ttsRate);
        ttsController.setVoice(viewSettings.ttsVoice);
        ttsController.speak(ssml);
        ttsControllerRef.current = ttsController;
      }
    } catch (error) {
      eventDispatcher.dispatch('toast', {
        message: _('TTS not supported in this device'),
        type: 'error',
      });
      console.error(error);
    }
  };

  /**
   * handleTTSStop
   *
   * Stops the current TTS playback.
   */
  const handleTTSStop = async () => {
    handleStop();
  };

  /**
   * handleQueryIsSpeaking
   *
   * Checks if the TTS controller is currently active.
   */
  const handleQueryIsSpeaking = () => {
    return !!ttsControllerRef.current;
  };

  /**
   * handleTogglePlay
   * Toggles the play/pause state of the TTS playback.
   */
  const handleTogglePlay = async () => {
    const ttsController = ttsControllerRef.current;
    if (!ttsController) return;

    if (isPlaying) {
      setIsPlaying(false);
      setIsPaused(true);
      await ttsController.pause();
    } else if (isPaused) {
      setIsPlaying(true);
      setIsPaused(false);
      // start for forward/backward/setvoice-paused
      // set rate don't pause the tts
      if (ttsController.state === 'paused') {
        await ttsController.resume();
      } else {
        await ttsController.start();
      }
    }
  };

  /**
   * handleBackward
   * Moves the TTS playback backward.
   */
  const handleBackward = async () => {
    const ttsController = ttsControllerRef.current;
    if (ttsController) {
      await ttsController.backward();
    }
  };

  /**
   * handleForward
   * Moves the TTS playback forward.
   */
  const handleForward = async () => {
    const ttsController = ttsControllerRef.current;
    if (ttsController) {
      await ttsController.forward();
    }
  };

  /**
   * handleStop
   * Stops the TTS playback and performs cleanup.
   */
  const handleStop = async () => {
    const ttsController = ttsControllerRef.current;
    if (ttsController) {
      await ttsController.stop();
      ttsControllerRef.current = null;
      getView(bookKey)?.deselect();
      setIsPlaying(false);
      setShowPanel(false);
      setShowIndicator(false);
    }
    if (appService?.isIOSApp) {
      await invokeUseBackgroundAudio({ enabled: false });
    }
    if (getOSPlatform() === 'ios' || appService?.isIOSApp) {
      releaseUnblockAudio();
    }
  };

  // rate range: 0.5 - 3, 1.0 is normal speed
  /**
   * handleSetRate
   *
   * Sets the playback rate of the TTS engine.
   * @param rate - The new playback rate.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSetRate = useCallback(
    throttle(async (rate: number) => {
      const ttsController = ttsControllerRef.current;
      if (ttsController) {
        if (ttsController.state === 'playing') {
          await ttsController.stop();
          await ttsController.setRate(rate);
          await ttsController.start();
        } else {
          await ttsController.setRate(rate);
        }
      }
    }, 3000),
    [],
  );

  /**
   * handleSetVoice
   *
   * Sets the voice of the TTS engine.
   * @param voice - The new voice to be used.
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSetVoice = useCallback(
    throttle(async (voice: string) => {
      const ttsController = ttsControllerRef.current;
      if (ttsController) {
        if (ttsController.state === 'playing') {
          await ttsController.stop();
          await ttsController.setVoice(voice);
          await ttsController.start();
        } else {
          await ttsController.setVoice(voice);
        }
      }
    }, 3000),
    [],
  );

  /**
   * handleGetVoices
   *
   * Retrieves the available voices for a specific language.
   * @param lang - The language code for which to retrieve voices.
   */
  const handleGetVoices = async (lang: string) => {
    const ttsController = ttsControllerRef.current;
    if (ttsController) {
      return ttsController.getVoices(lang);
    }
    return [];
  };

  /**
   * handleGetVoiceId
   *
   * Retrieves the current voice ID being used by the TTS engine.
   */
  const handleGetVoiceId = () => {
    const ttsController = ttsControllerRef.current;
    if (ttsController) {
      return ttsController.getVoiceId();
    }
    return '';
  };

  /**
   * handleSelectTimeout
   *
   * Sets a timeout for stopping the TTS playback.
   */
  const handleSelectTimeout = (value: number) => {
    setTimeoutOption(value);
    if (timeoutFunc) {
      clearTimeout(timeoutFunc);
    }
    if (value > 0) {
      setTimeoutFunc(
        setTimeout(() => {
          handleStop();
        }, value * 1000),
      );
      setTimeoutTimestamp(Date.now() + value * 1000);
    } else {
      setTimeoutTimestamp(0);
    }
  };

  /**
   * updatePanelPosition
   * Updates the position of the TTS panel relative to the TTS icon.
   */
  const updatePanelPosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const windowRect = document.documentElement.getBoundingClientRect();

      const trianglePos = {
        dir: 'up',
        point: { x: rect.left + rect.width / 2, y: rect.top - 12 },
      } as Position;

      const popupPos = getPopupPosition(
        trianglePos,
        windowRect,
        popupWidth,
        popupHeight,
        popupPadding,
      );

      setPanelPosition(popupPos);
      setTrianglePosition(trianglePos);
    }
  };

  /**
   * togglePopup
   * Toggles the visibility of the TTS panel.
   */
  const togglePopup = () => {
    updatePanelPosition();
    setShowPanel((prev) => !prev);
  };

  /**
   * handleDismissPopup
   * Dismisses the TTS panel by setting its visibility to false.
   */
  const handleDismissPopup = () => {
    setShowPanel(false);
  };

  return (
    <div>
      {showPanel && (
        <div
          // Overlay to dismiss the popup when clicked outside.
          className='fixed inset-0'
          onClick={handleDismissPopup}
          onContextMenu={handleDismissPopup}
        />
      )}
      {showIndicator && (
        <div
          // TTS icon container.
          ref={iconRef}
          className={clsx(
            'fixed right-6 h-12 w-12',
            appService?.hasSafeAreaInset
              ? 'bottom-[calc(env(safe-area-inset-bottom)+70px)]'
              : 'bottom-[70px] sm:bottom-14',
          )}
        >
          <TTSIcon isPlaying={isPlaying} onClick={togglePopup} />
        </div>
      )}
      {showPanel && panelPosition && trianglePosition && (
        // Popup container for the TTS panel.
        <Popup
          width={popupWidth}
          height={popupHeight}
          position={panelPosition}
          trianglePosition={trianglePosition}
          className='bg-base-200 absolute flex shadow-lg'
        >
          {/* TTS panel content */}
          <TTSPanel
            bookKey={bookKey}
            ttsLang={ttsLang}
            isPlaying={isPlaying}
            timeoutOption={timeoutOption}
            timeoutTimestamp={timeoutTimestamp}
            onTogglePlay={handleTogglePlay}
            onBackward={handleBackward}
            onForward={handleForward}
            onSetRate={handleSetRate}
            onGetVoices={handleGetVoices}
            onSetVoice={handleSetVoice}
            onGetVoiceId={handleGetVoiceId}
            onSelectTimeout={handleSelectTimeout}
          />
        </Popup>
      )}
    </div>
  );
};

export default TTSControl;
