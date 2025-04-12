import React, { useEffect, useState } from 'react';
// Import icons for writing mode options
import { MdOutlineAutoMode } from 'react-icons/md';
import { MdOutlineTextRotationNone, MdTextRotateVertical } from 'react-icons/md';
import { TbTextDirectionRtl } from 'react-icons/tb';

// Import necessary context, stores, and hooks
import { useEnv } from '@/context/EnvContext';
import { useReaderStore } from '@/store/readerStore';
import { useBookDataStore } from '@/store/bookDataStore';
import { useTranslation } from '@/hooks/useTranslation';
// Import utility functions for various purposes
import { isCJKEnv } from '@/utils/misc';
import { getStyles } from '@/utils/style';
import { getMaxInlineSize } from '@/utils/config';
import { getBookDirFromWritingMode, getBookLangCode } from '@/utils/book';
// Import constants
import { MIGHT_BE_RTL_LANGS } from '@/services/constants';
// Import helper function for saving view settings
import { saveViewSettings } from '../../utils/viewSettingsHelper';
// Import the NumberInput component
import NumberInput from './NumberInput';

// Define the LayoutPanel component, which accepts a bookKey prop
const LayoutPanel: React.FC<{ bookKey: string }> = ({ bookKey }) => {
  // Initialize translation hook
  const _ = useTranslation();
  // Access environment configuration
  const { envConfig } = useEnv();
  // Access reader store for managing view settings
  const { getView, getViewSettings, setViewSettings } = useReaderStore();
  // Access book data store for managing book data
  const { getBookData } = useBookDataStore();
  // Get the current view for the specified book
  const view = getView(bookKey);
  // Retrieve book data for the current book
  const bookData = getBookData(bookKey)!;
  // Get view settings for the current book
  const viewSettings = getViewSettings(bookKey)!;

  // Initialize state variables with values from view settings
  // These control various layout aspects of the reader view
  const [paragraphMargin, setParagraphMargin] = useState(viewSettings.paragraphMargin!);
  const [lineHeight, setLineHeight] = useState(viewSettings.lineHeight!);
  const [wordSpacing, setWordSpacing] = useState(viewSettings.wordSpacing!);
  const [letterSpacing, setLetterSpacing] = useState(viewSettings.letterSpacing!);
  const [textIndent, setTextIndent] = useState(viewSettings.textIndent!);
  const [fullJustification, setFullJustification] = useState(viewSettings.fullJustification!);
  // hyphenation option
  const [hyphenation, setHyphenation] = useState(viewSettings.hyphenation!);
  // margin
  const [marginPx, setMarginPx] = useState(viewSettings.marginPx!);
  const [gapPercent, setGapPercent] = useState(viewSettings.gapPercent!);
  const [maxColumnCount, setMaxColumnCount] = useState(viewSettings.maxColumnCount!);
  const [maxInlineSize, setMaxInlineSize] = useState(viewSettings.maxInlineSize!);
  const [maxBlockSize, setMaxBlockSize] = useState(viewSettings.maxBlockSize!);
  const [writingMode, setWritingMode] = useState(viewSettings.writingMode!);
  const [overrideLayout, setOverrideLayout] = useState(viewSettings.overrideLayout!);
  const [isScrolledMode, setScrolledMode] = useState(viewSettings.scrolled!);
  const [doubleBorder, setDoubleBorder] = useState(viewSettings.doubleBorder!);
  const [borderColor, setBorderColor] = useState(viewSettings.borderColor!);
  // show header and footer
  const [showHeader, setShowHeader] = useState(viewSettings.showHeader!);
  const [showFooter, setShowFooter] = useState(viewSettings.showFooter!);

  useEffect(() => {
    // Save paragraphMargin to view settings
    saveViewSettings(envConfig, bookKey, 'paragraphMargin', paragraphMargin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphMargin]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'lineHeight', lineHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineHeight]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'wordSpacing', wordSpacing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordSpacing]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'letterSpacing', letterSpacing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterSpacing]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'textIndent', textIndent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textIndent]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'fullJustification', fullJustification);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullJustification]);

  useEffect(() => {
    saveViewSettings(envConfig, bookKey, 'hyphenation', hyphenation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hyphenation]);

  useEffect(() => {
    // Save marginPx to view settings and update view renderer
    if (marginPx === viewSettings.marginPx) return;
    saveViewSettings(envConfig, bookKey, 'marginPx', marginPx, false, false);
    view?.renderer.setAttribute('margin', `${marginPx}px`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marginPx]);

  useEffect(() => {
    // Save gapPercent to view settings and update view renderer
    if (gapPercent === viewSettings.gapPercent) return;
    saveViewSettings(envConfig, bookKey, 'gapPercent', gapPercent, false, false);
    view?.renderer.setAttribute('gap', `${gapPercent}%`);
    if (viewSettings.scrolled) {
      view?.renderer.setAttribute('flow', 'scrolled');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapPercent]);

  useEffect(() => {
    // Save maxColumnCount to view settings and update view renderer
    if (maxColumnCount === viewSettings.maxColumnCount) return;
    saveViewSettings(envConfig, bookKey, 'maxColumnCount', maxColumnCount, false, false);
    view?.renderer.setAttribute('max-column-count', maxColumnCount);
    view?.renderer.setAttribute('max-inline-size', `${getMaxInlineSize(viewSettings)}px`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxColumnCount]);

  useEffect(() => {
    // Save maxInlineSize to view settings and update view renderer
    if (maxInlineSize === viewSettings.maxInlineSize) return;
    saveViewSettings(envConfig, bookKey, 'maxInlineSize', maxInlineSize, false, false);
    view?.renderer.setAttribute('max-inline-size', `${getMaxInlineSize(viewSettings)}px`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxInlineSize]);

  useEffect(() => {
    // Save maxBlockSize to view settings and update view renderer
    if (maxBlockSize === viewSettings.maxBlockSize) return;
    saveViewSettings(envConfig, bookKey, 'maxBlockSize', maxBlockSize, false, false);
    view?.renderer.setAttribute('max-block-size', `${maxBlockSize}px`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxBlockSize]);

  useEffect(() => {
    // Save writingMode to view settings and update view renderer
    if (writingMode === viewSettings.writingMode) return;
    // global settings are not supported for writing mode
    const prevWritingMode = viewSettings.writingMode;
    if (writingMode.includes('vertical')) {
      viewSettings.vertical = true;
    } else {
      viewSettings.vertical = false;
    }
    saveViewSettings(envConfig, bookKey, 'writingMode', writingMode, true);
    if (view) {
      view.renderer.setStyles?.(getStyles(viewSettings));
      view.book.dir = getBookDirFromWritingMode(writingMode);
    }
    if (
      prevWritingMode !== writingMode &&
      (['horizontal-rl', 'vertical-rl'].includes(writingMode) ||
        ['horizontal-rl', 'vertical-rl'].includes(prevWritingMode))
    ) {
      setTimeout(() => window.location.reload(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writingMode]);

  useEffect(() => {
    // Save overrideLayout to view settings
    saveViewSettings(envConfig, bookKey, 'overrideLayout', overrideLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideLayout]);

  useEffect(() => {
    // Save isScrolledMode to view settings and update view renderer
    if (isScrolledMode === viewSettings.scrolled) return;
    saveViewSettings(envConfig, bookKey, 'scrolled', isScrolledMode);
    getView(bookKey)?.renderer.setAttribute('flow', isScrolledMode ? 'scrolled' : 'paginated');
    getView(bookKey)?.renderer.setAttribute(
      'max-inline-size',
      `${getMaxInlineSize(viewSettings)}px`,
    );
    getView(bookKey)?.renderer.setStyles?.(getStyles(viewSettings!));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScrolledMode]);

  useEffect(() => {
    // Save doubleBorder to view settings and adjust gapPercent if necessary
    if (doubleBorder === viewSettings.doubleBorder) return;
    if (doubleBorder && viewSettings.vertical) {
      viewSettings.gapPercent = Math.max(
        viewSettings.gapPercent,
        Math.ceil(4800 / window.innerWidth),
      );
      setGapPercent(viewSettings.gapPercent);
      setViewSettings(bookKey, viewSettings);
    }
    saveViewSettings(envConfig, bookKey, 'doubleBorder', doubleBorder, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doubleBorder]);

  useEffect(() => {
    // Save borderColor to view settings
    saveViewSettings(envConfig, bookKey, 'borderColor', borderColor, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borderColor]);

  useEffect(() => {
    // Save showHeader to view settings and adjust marginPx or gapPercent if necessary
    if (showHeader === viewSettings.showHeader) return;
    if (showHeader && !viewSettings.vertical) {
      viewSettings.marginPx = Math.max(viewSettings.marginPx, 44);
      setMarginPx(viewSettings.marginPx);
      setViewSettings(bookKey, viewSettings);
    } else if (showHeader && viewSettings.vertical) {
      viewSettings.gapPercent = Math.max(
        viewSettings.gapPercent,
        Math.ceil(4800 / window.innerWidth),
      );
      setGapPercent(viewSettings.gapPercent);
      setViewSettings(bookKey, viewSettings);
    }
    saveViewSettings(envConfig, bookKey, 'showHeader', showHeader, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeader]);

  useEffect(() => {
    // Save showFooter to view settings and adjust marginPx or gapPercent if necessary
    if (showFooter === viewSettings.showFooter) return;
    if (showFooter && !viewSettings.vertical) {
      viewSettings.marginPx = Math.max(viewSettings.marginPx, 44);
      setMarginPx(viewSettings.marginPx);
      setViewSettings(bookKey, viewSettings);
    } else if (showFooter && viewSettings.vertical) {
      viewSettings.gapPercent = Math.max(
        viewSettings.gapPercent,
        Math.ceil(4800 / window.innerWidth),
      );
      setGapPercent(viewSettings.gapPercent);
      setViewSettings(bookKey, viewSettings);
    }
    saveViewSettings(envConfig, bookKey, 'showFooter', showFooter, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFooter]);

  // Determine if the book might be RTL based on language code or CJK environment
  const langCode = getBookLangCode(bookData.bookDoc?.metadata?.language);
  const mightBeRTLBook = MIGHT_BE_RTL_LANGS.includes(langCode) || isCJKEnv();

  // Render the component UI
  return (
    <div className='my-4 w-full space-y-6'>
      {/* Scrolled Mode Setting */}
      <div className='w-full'>
        <div className='flex items-center justify-between'>
          <h2 className='font-medium'>{_('Scrolled Mode')}</h2>
          <input
            type='checkbox'
            className='toggle'
            checked={isScrolledMode}
            onChange={() => setScrolledMode(!isScrolledMode)}
          />
        </div>
      </div>

      {/* Writing Mode Settings (only shown for RTL books) */}
      {mightBeRTLBook && (
        <div className='w-full'>
          <div className='flex items-center justify-between'>
            <h2 className='font-medium'>{_('Writing Mode')}</h2>
            <div className='flex gap-4'>
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Default')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${writingMode === 'auto' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setWritingMode('auto')}
                >
                  <MdOutlineAutoMode />
                </button>
              </div>

              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Horizontal Direction')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${writingMode === 'horizontal-tb' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setWritingMode('horizontal-tb')}
                >
                  <MdOutlineTextRotationNone />
                </button>
              </div>

              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('Vertical Direction')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${writingMode === 'vertical-rl' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setWritingMode('vertical-rl')}
                >
                  <MdTextRotateVertical />
                </button>
              </div>

              <div className='lg:tooltip lg:tooltip-bottom' data-tip={_('RTL Direction')}>
                <button
                  className={`btn btn-ghost btn-circle btn-sm ${writingMode === 'horizontal-rl' ? 'btn-active bg-base-300' : ''}`}
                  onClick={() => setWritingMode('horizontal-rl')}
                >
                  <TbTextDirectionRtl />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Border Frame Settings (only shown in vertical mode) */}
      {viewSettings.vertical && (
        <div className='w-full'>
          <h2 className='mb-2 font-medium'>{_('Border Frame')}</h2>
          <div className='card bg-base-100 border-base-200 border shadow'>
            <div className='divide-base-200 divide-y'>
              <div className='config-item'>
                <span className=''>{_('Double Border')}</span>
                <input
                  type='checkbox'
                  className='toggle'
                  checked={doubleBorder}
                  onChange={() => setDoubleBorder(!doubleBorder)}
                />
              </div>

              <div className='config-item'>
                <span className=''>{_('Border Color')}</span>
                <div className='flex gap-4'>
                  <button
                    className={`btn btn-circle btn-sm bg-red-300 hover:bg-red-500 ${borderColor === 'red' ? 'btn-active !bg-red-500' : ''}`}
                    onClick={() => setBorderColor('red')}
                  ></button>

                  <button
                    className={`btn btn-circle btn-sm bg-black/50 hover:bg-black ${borderColor === 'black' ? 'btn-active !bg-black' : ''}`}
                    onClick={() => setBorderColor('black')}
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paragraph Settings */}
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Paragraph')}</h2>
        <div className='card bg-base-100 border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <NumberInput
              label={_('Paragraph Margin')}
              value={paragraphMargin}
              onChange={setParagraphMargin}
              min={0}
              max={4}
              step={0.5}
            />
            <NumberInput
              label={_('Line Spacing')}
              value={lineHeight}
              onChange={setLineHeight}
              min={1.0}
              max={3.0}
              step={0.1}
            />
            {langCode !== 'zh' && (
              <NumberInput
                label={_('Word Spacing')}
                value={wordSpacing}
                onChange={setWordSpacing}
                min={-4}
                max={8}
                step={0.5}
              />
            )}
            <NumberInput
              label={_('Letter Spacing')}
              value={letterSpacing}
              onChange={setLetterSpacing}
              min={-2}
              max={4}
              step={0.5}
            />
            <NumberInput
              label={_('Text Indent')}
              value={textIndent}
              onChange={setTextIndent}
              min={-2}
              max={4}
              step={1}
            />
            <div className='config-item'>
              <span className=''>{_('Full Justification')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={fullJustification}
                onChange={() => setFullJustification(!fullJustification)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Hyphenation')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={hyphenation}
                onChange={() => setHyphenation(!hyphenation)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Override Book Layout')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={overrideLayout}
                onChange={() => setOverrideLayout(!overrideLayout)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page Settings */}
      <div className='w-full'>
        <h2 className='mb-2 font-medium'>{_('Page')}</h2>
        <div className='card bg-base-100 border-base-200 border shadow'>
          <div className='divide-base-200 divide-y'>
            <div className='config-item'>
              <span className=''>{_('Show Header')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={showHeader}
                onChange={() => setShowHeader(!showHeader)}
              />
            </div>
            <div className='config-item'>
              <span className=''>{_('Show Footer')}</span>
              <input
                type='checkbox'
                className='toggle'
                checked={showFooter}
                onChange={() => setShowFooter(!showFooter)}
              />
            </div>
            <NumberInput
              label={_('Vertical Margins (px)')}
              value={marginPx}
              onChange={setMarginPx}
              min={!viewSettings.vertical && (showFooter || showHeader) ? 44 : 0}
              max={88}
              step={4}
            />
            <NumberInput
              label={_('Horizontal Margins (%)')}
              value={gapPercent}
              onChange={setGapPercent}
              min={
                viewSettings.vertical && (showFooter || showHeader)
                  ? Math.ceil(4800 / window.innerWidth)
                  : 0
              }
              max={30}
            />
            <NumberInput
              label={_('Maximum Number of Columns')}
              value={maxColumnCount}
              onChange={setMaxColumnCount}
              min={1}
              max={4}
            />
            <NumberInput
              label={viewSettings.vertical ? _('Maximum Column Height') : _('Maximum Column Width')}
              value={maxInlineSize}
              onChange={setMaxInlineSize}
              disabled={maxColumnCount === 1 || viewSettings.scrolled}
              min={400}
              max={9999}
              step={100}
            />
            <NumberInput
              label={viewSettings.vertical ? _('Maximum Column Width') : _('Maximum Column Height')}
              value={maxBlockSize}
              onChange={setMaxBlockSize}
              disabled={maxColumnCount === 1 || viewSettings.scrolled}
              min={400}
              max={9999}
              step={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutPanel;
