import React, { useState } from 'react'; // Importing necessary modules from React

// Defining the properties (props) that the PopupButton component will receive
interface PopupButtonProps {
  showTooltip: boolean; // Flag to determine if a tooltip should be displayed
  tooltipText: string; // The text to be displayed in the tooltip
  Icon: React.ElementType; // The icon component to be displayed within the button
  onClick: () => void; // Callback function to be executed when the button is clicked
}

// Defining the PopupButton functional component with the specified props
const PopupButton: React.FC<PopupButtonProps> = ({ showTooltip, tooltipText, Icon, onClick }) => {
  // State variable to track if the button has been clicked
  const [buttonClicked, setButtonClicked] = useState(false); 

  // Function to handle the button click event
  const handleClick = () => {
    setButtonClicked(true); // Update the state to indicate the button has been clicked
    onClick(); // Execute the callback function passed as a prop
  };

  // Returning the JSX that represents the PopupButton component
  return (
    // A div used as a wrapper for the button, applying Tailwind CSS classes for styling
    <div
      className='lg:tooltip lg:tooltip-bottom'
      // Conditionally applying the 'data-tip' attribute to show tooltip.
      // Tooltip will only appear if button hasn't been clicked and 'showTooltip' is true
      data-tip={!buttonClicked && showTooltip ? tooltipText : null}
    >
      {/* The button element itself, triggering 'handleClick' on click */}
      <button
        onClick={handleClick} 
        // Applying flex layout and size constraints with Tailwind CSS
        className='flex h-8 min-h-8 w-8 items-center justify-center p-0'
      >
        {/* Rendering the icon passed as a prop */}
        <Icon /> 
      </button>
    </div>
  );
};

// Exporting the PopupButton component to be used in other parts of the application
export default PopupButton;
