import React, { useEffect, useState } from 'react';

// Interface for Slider component properties
interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  initialValue?: number;
  heightPx?: number;
  minLabel?: string;
  maxLabel?: string;
  bubbleElement?: React.ReactNode;
  bubbleLabel?: string;
  className?: string;
  minClassName?: string;
  maxClassName?: string;
  bubbleClassName?: string;
  onChange?: (value: number) => void;
}

// Slider component definition
const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  initialValue = 50,
  heightPx = 40,
  minLabel = '',
  maxLabel = '',
  bubbleElement,
  bubbleLabel = '',
  className = '',
  minClassName = '',
  maxClassName = '',
  bubbleClassName = '',
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);
  // function to handle changes in the slider value
  // This function is triggered when the slider's value changes
  const handleChange = (e: React.ChangeEvent) => {
    // Extract the new value from the input event and convert it to an integer
    const newValue = parseInt((e.target as HTMLInputElement).value, 10);
    // Update the state with the new value
    setValue(newValue);
    // If there is an onChange callback provided, call it with the new value
    if (onChange) {
      onChange(newValue);
    }
  };
  // useEffect hook to update the slider value when the initialValue prop changes
  // This ensures the slider stays in sync with any external state changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  // Calculate the percentage of the current value within the min/max range
  const percentage = ((value - min) / (max - min)) * 100;
  // slider container
  return (
    <div className={`slider bg-base-200 mx-auto w-full max-w-md rounded-xl ${className}`}>
      <div className='relative' style={{ height: `${heightPx}px` }}>
        <div className='bg-base-300/40 absolute h-full w-full rounded-full'></div>
        <div
          className='bg-base-300 absolute h-full rounded-full'
          style={{ width: percentage > 0 ? `calc(${percentage}% + ${heightPx / 2}px)` : '0px' }}
        ></div>
        <div className='absolute inset-0 flex items-center justify-between px-4 text-sm'>
          <span className={`ml-2 ${minClassName}`}>{minLabel}</span>
          <span className={`mr-2 ${maxClassName}`}>{maxLabel}</span>
        </div>
        <div
          className='pointer-events-none absolute top-0 z-10'
          style={{
            left: `max(${heightPx / 2}px, calc(${percentage}%))`,
            transform: 'translateX(calc(-50%))',
            height: '100%',
          }}
        >
          <div
            className={`bg-base-200 flex h-full items-center justify-center rounded-full text-sm shadow-md ${bubbleClassName}`}
            style={{ width: `${heightPx}px` }}
          >
            {bubbleElement || bubbleLabel}
          </div>
        </div>
        <input
        //the input range to change the value
          type='range'
          min={min}
          max={max}
          step={step}
          value={value}
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
 // Export the Slider component as the default export
// This allows it to be easily imported in other parts of the application
export default Slider;
