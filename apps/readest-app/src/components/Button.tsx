import React from 'react';
import clsx from 'clsx';

/**
 * Interface for the Button component props.
 */
interface ButtonProps {
  icon: React.ReactNode; // The icon to be displayed inside the button.
  onClick: () => void; // Callback function to be executed when the button is clicked.
  disabled?: boolean; // Determines if the button is disabled.
  tooltip?: string; // The tooltip text to be displayed on hover.
  tooltipDirection?: 'top' | 'bottom' | 'left' | 'right'; // The direction in which the tooltip should appear.
  className?: string; // Additional CSS class names for styling.
}

/**
 * Button Component
 *
 * A reusable button component that can display an icon and optionally a tooltip.
 * It supports being disabled and allows customization through CSS classes.
 */
const Button: React.FC<ButtonProps> = ({
  icon, // The icon to be displayed inside the button.
  onClick, // Callback function when the button is clicked.
  disabled = false, // Default to false, can be set to true to disable the button.
  tooltip, // Optional tooltip text.
  tooltipDirection = 'top', // Default tooltip direction is 'top'.
  className, // Optional additional CSS class names.
}) => {
  return (
    // The outer div that contains the button and manages the tooltip.
    <div
      className={clsx(
        'lg:tooltip z-50 h-8 min-h-8 w-8', // Base classes for the div, including tooltip settings.
        tooltip && `lg:tooltip-${tooltipDirection}`, // If a tooltip is provided, append the direction class.
        {
          'tooltip-hidden': !tooltip, // If no tooltip is provided, hide it.
        },
      )}
      data-tip={tooltip} // Set the data-tip attribute for the tooltip text.
    >
      {/*
        Actual button element.
        It uses `btn btn-ghost` for styling.
        `btn-disabled` is added when the button is disabled.
        onClick event is only triggered if the button is not disabled.
        `disabled` attribute is also set based on the disabled state.
      */}
      <button
        className={clsx(
          'btn btn-ghost h-8 min-h-8 w-8 p-0', // Base button style.
          disabled && 'btn-disabled !bg-transparent', // Disable style override.
          className, // Optional additional CSS class names.
        )}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
      >
        {icon}
      </button>
    </div>
  );
};

export default Button;
