// Import necessary React modules and the color picker component.
import React, { useState, useEffect, useRef } from 'react';
import { SketchPicker, ColorResult } from 'react-color';

// Define the props interface for the ColorInput component.
type ColorInputProps = {
  label: string; // The label for the color input field.
  value: string; // The current color value in hexadecimal format.
  onChange: (value: string) => void; // Callback function to handle color changes.
};

// Define the ColorInput functional component.
const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  // State to manage the visibility of the color picker.
  const [isOpen, setIsOpen] = useState(false); 
  // Ref to reference the color picker container for outside click detection.
  const pickerRef = useRef<HTMLDivElement>(null); 

  // Effect to handle clicks outside the color picker to close it.
  useEffect(() => {
    // Function to handle clicks outside the color picker.
    function handleClickOutside(event: MouseEvent) {
      // Check if the click is outside the pickerRef.
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Close the color picker if the click is outside.
        setIsOpen(false);
      }
    }

    // Add or remove the event listener based on the isOpen state.
    // When the color picker is open, listen for outside clicks.
    if (isOpen) {
      // Attach the event listener when the picker is open.
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Function to handle color changes in the SketchPicker.
  const handlePickerChange = (colorResult: ColorResult) => {
    // Update the color value using the onChange callback.
    onChange(colorResult.hex);
  };

  // Render the component UI.
  return (
    // Main container for the color input.
    <div className='mb-3'>
      {/* Label for the color input. */}
      <label className='mb-1 block text-sm font-medium'>{label}</label>
      {/* Container for the color preview and text input. */}
      <div className='flex items-center'>
        {/* Color preview square. */}
        <div
          className='border-base-200 relative mr-2 flex h-7 w-8 cursor-pointer items-center justify-center overflow-hidden rounded border'
          style={{ backgroundColor: value }} // Set the background color to the current value.
          onClick={() => setIsOpen(!isOpen)} // Toggle the color picker when clicked.
        /> 
        {/* Text input for manual color entry. */}
        <input
          type='text'
          value={value} // Display the current color value.
          onChange={(e) => onChange(e.target.value)} // Update the color value on change.
          className='bg-base-100 text-base-content border-base-200 min-w-4 max-w-36 flex-1 rounded border p-1 font-mono text-sm'
        />
      </div>

      {isOpen && (
        <div ref={pickerRef} className='relative z-50 mt-2'>
          <div className='absolute'>
            {/* SketchPicker component for selecting colors. */}
            <SketchPicker
              width='100%'
              color={value} // Set the current color in the picker.
              onChange={handlePickerChange} // Handle color changes in the picker.
              disableAlpha={true} // Disable alpha channel selection.
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Export the ColorInput component as the default export.
export default ColorInput;
