import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';
/**
 * Interface for the NumberInput component's props.
 */
interface NumberInputProps {
  className?: string; // Optional CSS class name for styling.
  label: string; // Label to display next to the input.
  value: number; // Current value of the input.
  min: number; // Minimum allowed value.
  max: number; // Maximum allowed value.
  step?: number; // Step for increment/decrement buttons, defaults to 1.
  disabled?: boolean; // Whether the input is disabled.
  onChange: (value: number) => void; // Callback function for value changes.
}
/**
 * NumberInput Component
 *
 * A controlled component for numerical input with increment and decrement buttons.
 */
const NumberInput: React.FC<NumberInputProps> = ({
  className,
  label,
  value,
  onChange,
  min,
  max, // Maximum value
  step, // Step for increment/decrement
  disabled, // Indicates whether the input is disabled or not
}) => {
  // Local state to manage the input's value.
  const [localValue, setLocalValue] = useState(value);
  // If a step value is provided, use it. Otherwise, default to 1.
  const numberStep = step || 1;
  /**
   * Effect to synchronize localValue with the external value prop.
   * This is important for when the value is changed from outside the component.
   */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Handles input change events.
   *
   * Validates the input and updates the local state and calls onChange prop.
   *
   * @param e - The change event.
   *
   * @returns void
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string or valid numbers without leading zeros
    if (value === '' || /^[1-9]\d*\.?\d*$|^0?\.?\d*$/.test(value)) {
      const newValue = value === '' ? 0 : parseFloat(value);
      setLocalValue(newValue);

      if (!isNaN(newValue)) {
        const roundedValue = Math.round(newValue * 10) / 10;
        onChange(Math.max(min, Math.min(max, roundedValue)));
      }
    }
  };
  /**
   * Increments the value by the step, up to the maximum value.
   *
   * @returns void
   */
  const increment = () => {
    const newValue = Math.min(max, localValue + numberStep);
    const roundedValue = Math.round(newValue * 10) / 10;
    setLocalValue(roundedValue);
    onChange(roundedValue);
  };
  /**
   * Decrements the value by the step, down to the minimum value.
   *
   * @returns void
   */
  const decrement = () => {
    const newValue = Math.max(min, localValue - numberStep);
    const roundedValue = Math.round(newValue * 10) / 10;
    setLocalValue(roundedValue);
    onChange(roundedValue);
  };
  /**
   * Handles blur events to ensure the value is within the valid range.
   *
   * @returns void
   */
  const handleOnBlur = () => {
    const newValue = Math.max(min, Math.min(max, localValue));
    setLocalValue(newValue);
    onChange(newValue);
  };

  /**
   * Renders the component.
   *
   * It consists of a label, an input field, and increment/decrement buttons.
   *
   * @returns JSX.Element
   */
  return (
    <div className={clsx('config-item', className)}>
      <span className='text-base-content'>{label}</span>
      <div className='text-base-content flex items-center gap-2'>
        <input
          type='text'
          inputMode='decimal'
          value={localValue}
          onChange={handleChange}
          onBlur={handleOnBlur}
          className='input input-ghost settings-content text-base-content w-20 max-w-xs rounded border-0 bg-transparent px-3 py-1 text-right !outline-none'
          onFocus={(e) => e.target.select()}
        />
        <button
          onClick={decrement}
          className={`btn btn-circle btn-sm ${value <= min || disabled ? 'btn-disabled !bg-opacity-5' : ''}`}
        >
          <FiMinus className='h-4 w-4' />
        </button>
        <button
          onClick={increment}
          className={`btn btn-circle btn-sm ${value >= max || disabled ? 'btn-disabled !bg-opacity-5' : ''}`}
        >
          <FiPlus className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};

export default NumberInput;
