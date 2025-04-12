import React from 'react';
import clsx from 'clsx';
// Import necessary icons from 'react-icons' for UI elements
import { RiArrowLeftWideLine, RiArrowRightWideLine } from 'react-icons/ri';
import { RiArrowGoBackLine, RiArrowGoForwardLine } from 'react-icons/ri';
import { FaHeadphones } from 'react-icons/fa6';
import { IoIosList as TOCIcon } from 'react-icons/io';
import { PiNotePencil as NoteIcon } from 'react-icons/pi';
import { RxSlider as SliderIcon } from 'react-icons/rx'; // Slider Icon
import { RiFontFamily as FontIcon } from 'react-icons/ri';
import { MdOutlineHeadphones as TTSIcon } from 'react-icons/md'; // Text to speech icon
import { TbBoxMargin } from 'react-icons/tb';
import { RxLineHeight } from 'react-icons/rx';

// Import custom hooks and utilities
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useSidebarStore } from '@/store/sidebarStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useResponsiveSize } from '@/hooks/useResponsiveSize';
import { eventDispatcher } from '@/utils/event';
// Import utility to save view settings
import { saveViewSettings } from '../utils/viewSettingsHelper';
import { PageInfo } from '@/types/book';
// Import custom components
import Button from '@/components/Button';
import Slider from '@/components/Slider';

/**
 * Interface for the props of the FooterBar component.
 * @interface FooterBarProps
 * @property {string} bookKey - The key identifier for the book.
 * @property {string} bookFormat - The format of the book (e.g., 'EPUB', 'PDF').
 * @property {PageInfo} [section] - Information about the current section (for PDF format).
 * @property {PageInfo} [pageinfo] - Information about the current page (for non-PDF formats).
 * @property {boolean} isHoveredAnim - Indicates if the hover animation is active.
 */
interface FooterBarProps {
  bookKey: string;
  bookFormat: string;
  section?: PageInfo;
  pageinfo?: PageInfo;
  isHoveredAnim: boolean; // Indicates whether the footer bar is hovered
}

const FooterBar: React.FC<FooterBarProps> = ({
  bookKey,
  bookFormat,
  section,
  pageinfo,
  isHoveredAnim,
}) => {
  // Custom hooks for translation, environment, reader store, and sidebar store
  const _ = useTranslation();
  const { envConfig, appService } = useEnv();
  const { hoveredBookKey, setHoveredBookKey, getView, getProgress, getViewSettings } =
    useReaderStore();
  const { isSideBarVisible, setSideBarVisible } = useSidebarStore();

  // State to manage the active tab in the footer bar
  const [actionTab, setActionTab] = React.useState('');

  // Responsive sizes for UI elements based on screen size
  const sliderHeight = useResponsiveSize(28);
  const tocIconSize = useResponsiveSize(23);
  const fontIconSize = useResponsiveSize(18);
  const marginIconSize = useResponsiveSize(20);

  // Retrieve view, progress, and view settings for the current book
  const view = getView(bookKey);
  const progress = getProgress(bookKey);
  const viewSettings = getViewSettings(bookKey);

  /**
   * Handles the change in progress (page navigation).
   * @param {number} value - The new progress value (0-100).
   */
  const handleProgressChange = (value: number) => {
    view?.goToFraction(value / 100.0);
  };

  /**
   * Handles the change in font size.
   * @param {number} value - The new font size.
   */
  const handleFontSizeChange = (value: number) => {
    saveViewSettings(envConfig, bookKey, 'defaultFontSize', value);
  };

  /**
   * Handles the change in margin and gap settings.
   * @param {number} value - The new margin/gap value (0-100).
   */
  const handleMarginChange = (value: number) => {
    const marginPx = Math.round((value / 100) * 88);
    const gapPercent = Math.round((value / 100) * 10);
    saveViewSettings(envConfig, bookKey, 'marginPx', marginPx, false, false);
    saveViewSettings(envConfig, bookKey, 'gapPercent', gapPercent, false, false);
    view?.renderer.setAttribute('margin', `${marginPx}px`);
    view?.renderer.setAttribute('gap', `${gapPercent}%`);
    if (viewSettings?.scrolled) {
      view?.renderer.setAttribute('flow', 'scrolled');
    }
  };

  /**
   * Handles the change in line height.
   * @param {number} value - The new line height value.
   */
  const handleLineHeightChange = (value: number) => {
    saveViewSettings(envConfig, bookKey, 'lineHeight', value / 10);
  };

  /**
   * Navigate to the previous page.
   */
  const handleGoPrev = () => {
    view?.goLeft();
  };

  /**
   * Navigate to the next page.
   */
  const handleGoNext = () => {
    view?.goRight();
  };

  /**
   * Navigate back in the history.
   */
  const handleGoBack = () => {
    view?.history.back();
  };

  /**
   * Navigate forward in the history.
   */
  const handleGoForward = () => {
    view?.history.forward();
  };

  /**
   * Handles text-to-speech functionality.
   * Starts or stops speech based on the current state.
   */
  const handleSpeakText = async () => {
    if (!view || !progress) return;
    const { range } = progress;
    // Check if TTS is currently active
    if (eventDispatcher.dispatchSync('tts-is-speaking')) {
      // Stop text-to-speech
      eventDispatcher.dispatch('tts-stop', { bookKey });
    } else {
      // Start text-to-speech
      eventDispatcher.dispatch('tts-speak', { bookKey, range });
    }
  };

  /**
   * Sets the currently active tab in the footer bar.
   * @param {string} tab - The name of the tab to set.
   */
  const handleSetActionTab = (tab: string) => {
    setActionTab(actionTab === tab ? '' : tab);
    // Handle specific actions based on the selected tab
    if (tab === 'tts') {
      setHoveredBookKey('');
      handleSpeakText();
    } else if (tab === 'toc') {
      setHoveredBookKey('');
      if (viewSettings) {
        viewSettings.sideBarTab = 'toc';
      }
      setSideBarVisible(true);
    } else if (tab === 'note') {
      setHoveredBookKey('');
      setSideBarVisible(true);
      if (viewSettings) {
        viewSettings.sideBarTab = 'annotations';
      }
    }
  };

  /**
   * Calculates the combined progress value for margin and gap.
   * @param {number} marginPx - The margin in pixels.
   * @param {number} gapPercent - The gap percentage.
   * @returns {number} The calculated progress value.
   */
  const getMarginProgressValue = (marginPx: number, gapPercent: number) => {
    return (marginPx / 88 + gapPercent / 10) * 50;
  };

  // Determine if the footer bar should be visible based on the hovered state
  const isVisible = hoveredBookKey === bookKey;

  // Determine progress information based on book format

  const progressInfo = bookFormat === 'PDF' ? section : pageinfo;
  const progressValid = !!progressInfo;
  const progressFraction = progressValid
    ? ((progressInfo!.next ?? progressInfo!.current) + 1) / progressInfo!.total
    : 0;

  return (
    <>
      <div
      // Hidden element to trigger onHover in parent element
        className={clsx(
          'absolute bottom-0 left-0 z-10 hidden w-full sm:flex sm:h-[52px]',
          // show scroll bar when vertical and scrolled in desktop
          viewSettings?.vertical && viewSettings?.scrolled && 'sm:!bottom-3 sm:!h-7',
        )}
        onMouseEnter={() => !appService?.isMobile && setHoveredBookKey(bookKey)}
        onTouchStart={() => !appService?.isMobile && setHoveredBookKey(bookKey)}
      />
      <div
        // Main FooterBar container
        className={clsx(
          'footer-bar shadow-xs absolute bottom-0 z-50 flex w-full flex-col',
          'sm:h-[52px] sm:justify-center',
          'sm:bg-base-100 border-base-300/50 border sm:border-none',
          'transition-[opacity,transform] duration-300',
          appService?.hasRoundedWindow && 'rounded-window-bottom-right',
          !isSideBarVisible && appService?.hasRoundedWindow && 'rounded-window-bottom-left',
          isHoveredAnim && 'hover-bar-anim',
          // show scroll bar when vertical and scrolled in desktop
          viewSettings?.vertical && viewSettings?.scrolled && 'sm:!bottom-3 sm:!h-7',
          isVisible
            ? `pointer-events-auto translate-y-0 opacity-100`
            : `pointer-events-none translate-y-full opacity-0 sm:translate-y-0`,
        )}
        dir={viewSettings?.rtl ? 'rtl' : 'ltr'}
        onMouseLeave={() => window.innerWidth >= 640 && setHoveredBookKey('')}
        aria-hidden={!isVisible}
      >
        {/* Mobile footer bar */}
        {/* Progress Tab for mobile devices */}
        <div
          className={clsx(
            'bg-base-200 absolute bottom-16 flex w-full items-center gap-x-2 px-4 transition-all sm:hidden',
            actionTab === 'progress'
              ? 'pointer-events-auto translate-y-0 pb-4 pt-8 ease-out'
              : 'pointer-events-none invisible translate-y-full overflow-hidden pb-0 pt-0 ease-in',
          )}
          style={{
            bottom: appService?.hasSafeAreaInset
              ? 'calc(env(safe-area-inset-bottom) + 64px)'
              : '64px',
          }}
        >
          <Button
            icon={viewSettings?.rtl ? <RiArrowRightWideLine /> : <RiArrowLeftWideLine />}
            onClick={viewSettings?.rtl ? handleGoNext : handleGoPrev}
            tooltip={viewSettings?.rtl ? _('Go Right') : _('Go Left')}
          />
          <Button
            icon={viewSettings?.rtl ? <RiArrowGoForwardLine /> : <RiArrowGoBackLine />}
            onClick={handleGoBack}
            tooltip={_('Go Back')}
            disabled={!view?.history.canGoBack}
          />
          <Button
            icon={viewSettings?.rtl ? <RiArrowGoBackLine /> : <RiArrowGoForwardLine />}
            onClick={handleGoForward}
            tooltip={_('Go Forward')}
            disabled={!view?.history.canGoForward}
          />
          <Slider
            heightPx={sliderHeight}
            bubbleLabel={`${Math.round(progressFraction * 100)}%`}
            initialValue={progressValid ? progressFraction * 100 : 0}
            onChange={(e) => handleProgressChange(e)}
          />
          <Button
            icon={viewSettings?.rtl ? <RiArrowLeftWideLine /> : <RiArrowRightWideLine />}
            onClick={viewSettings?.rtl ? handleGoPrev : handleGoNext}
            tooltip={viewSettings?.rtl ? _('Go Left') : _('Go Right')}
          />
        </div>
        {/* Font and layout settings for mobile */}
        <div
          className={clsx(
            'bg-base-200 absolute flex w-full flex-col items-center gap-y-8 px-4 transition-all sm:hidden',
            actionTab === 'font'
              ? 'pointer-events-auto translate-y-0 pb-4 pt-8 ease-out'
              : 'pointer-events-none invisible translate-y-full overflow-hidden pb-0 pt-0 ease-in',
          )}
          style={{
            bottom: appService?.hasSafeAreaInset
              ? 'calc(env(safe-area-inset-bottom) + 64px)'
              : '64px',
          }}
        >
          <Slider
            initialValue={viewSettings?.defaultFontSize ?? 16}
            bubbleLabel={`${viewSettings?.defaultFontSize ?? 16}`}
            minLabel='A'
            maxLabel='A'
            minClassName='text-xs'
            maxClassName='text-base'
            onChange={handleFontSizeChange}
            min={8}
            max={30}
          />
          <div className='flex w-full items-center justify-between gap-x-6'>
            <Slider
              initialValue={getMarginProgressValue(
                viewSettings?.marginPx ?? 44,
                viewSettings?.gapPercent ?? 5,
              )}
              bubbleElement={<TbBoxMargin size={marginIconSize} />}
              minLabel={_('Small')}
              maxLabel={_('Large')}
              step={10}
              onChange={handleMarginChange}
            />
            <Slider
              initialValue={(viewSettings?.lineHeight ?? 1.6) * 10}
              bubbleElement={<RxLineHeight size={marginIconSize} />}
              minLabel={_('Small')}
              maxLabel={_('Large')}
              min={8}
              max={24}
              onChange={handleLineHeightChange}
            />
          </div>
        </div>
        {/* Navigation buttons in mobile footer bar */}
        <div
          className={clsx(
            'bg-base-200 z-50 mt-auto flex w-full justify-between px-8 py-4 sm:hidden',
            appService?.hasSafeAreaInset && 'pb-[calc(env(safe-area-inset-bottom)+16px)]',
          )}
        >
          <Button
            icon={<TOCIcon size={tocIconSize} className='' />}
            onClick={() => handleSetActionTab('toc')}
          />
          <Button icon={<NoteIcon className='' />} onClick={() => handleSetActionTab('note')} />
          <Button
            icon={<SliderIcon className={clsx(actionTab === 'progress' && 'text-blue-500')} />}
            onClick={() => handleSetActionTab('progress')}
          />
          <Button
            icon={
              <FontIcon
                size={fontIconSize}
                className={clsx(actionTab === 'font' && 'text-blue-500')}
              />
            }
            onClick={() => handleSetActionTab('font')}
          />
          <Button icon={<TTSIcon className='' />} onClick={() => handleSetActionTab('tts')} />
        </div>
        {/* Desktop footer bar */}
        <div className='hidden w-full items-center gap-x-4 px-4 sm:flex'>
          <Button
            icon={viewSettings?.rtl ? <RiArrowRightWideLine /> : <RiArrowLeftWideLine />}
            onClick={viewSettings?.rtl ? handleGoNext : handleGoPrev}
            tooltip={viewSettings?.rtl ? _('Go Right') : _('Go Left')}
          />
          <Button
            icon={viewSettings?.rtl ? <RiArrowGoForwardLine /> : <RiArrowGoBackLine />}
            onClick={handleGoBack}
            tooltip={_('Go Back')}
            disabled={!view?.history.canGoBack}
          />
          <Button
            icon={viewSettings?.rtl ? <RiArrowGoBackLine /> : <RiArrowGoForwardLine />}
            onClick={handleGoForward}
            tooltip={_('Go Forward')}
            disabled={!view?.history.canGoForward}
          />
          <span className='mx-2 text-center text-sm'>
            {progressValid ? `${Math.round(progressFraction * 100)}%` : ''}
          </span>
          <input
            type='range'
            className='text-base-content mx-2 w-full'
            min={0}
            max={100}
            value={progressValid ? progressFraction * 100 : 0}
            onChange={(e) =>
              handleProgressChange(parseInt((e.target as HTMLInputElement).value, 10))
            }
          />
          <Button icon={<FaHeadphones />} onClick={handleSpeakText} tooltip={_('Speak')} />
          <Button
            icon={viewSettings?.rtl ? <RiArrowLeftWideLine /> : <RiArrowRightWideLine />}
            onClick={viewSettings?.rtl ? handleGoPrev : handleGoNext}
            tooltip={viewSettings?.rtl ? _('Go Left') : _('Go Right')}
          />
        </div>
      </div>
    </>
  );
};

export default FooterBar;
