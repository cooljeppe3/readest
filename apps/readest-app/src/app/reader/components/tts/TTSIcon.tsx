import React from 'react';

// Define the type for the props that the TTSIcon component will receive.
type TTSIconProps = {
  isPlaying: boolean; // Indicates whether the TTS (Text-to-Speech) is currently playing.
  onClick: () => void; // A callback function to be executed when the icon is clicked.
};

// Define the TTSIcon functional component, which is responsible for rendering the icon used for TTS playback.
const TTSIcon: React.FC<TTSIconProps> = ({ isPlaying, onClick }) => {
  // An array representing the number of bars to be displayed in the icon.
  const bars = [1, 2, 3, 4]; 

  return (
    // Main container for the TTSIcon, making it clickable and setting its size to fill its parent.
    <div className='relative h-full w-full cursor-pointer' onClick={onClick}>
      {/* A div with a gradient background that will move when TTS is playing */}
      <div className='absolute inset-0 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500'>
        {/* Animated gradient layer to show activity */}
        <div
          className='absolute -inset-full bg-gradient-to-r from-blue-500 via-emerald-500 to-violet-500'
          // Apply the 'moveGradient' animation when isPlaying is true, otherwise no animation.
          style={{
            animation: isPlaying ? 'moveGradient 2s alternate infinite' : 'none',
          }}
        />
      </div>

      {/* Container for the bars that visually represent the sound activity. */}
      <div className='absolute inset-0 flex items-center justify-center'>
        {/* Define the CSS keyframe animations for the gradient movement and the bouncing effect. */}
        <style>{`
          // Keyframes for moving the gradient horizontally.
          @keyframes moveGradient {
            0% { transform: translate(0, 0); } // Start at the original position.
            100% { transform: translate(25%, 25%); } // Move to the right and down by 25% of the element's size.
          }
          // Keyframes for the bouncing animation of the bars.
          // This will simulate the bars jumping up and down.
          // scaleY will modify the vertical scale of the elements
          @keyframes bounce {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(0.6); }
          }
        `}</style>
        <div className='flex items-end space-x-1'>
          {bars.map((bar) => (
            // For each bar number, create a div that represents a bar.
            <div
              key={bar}
              className='w-1 rounded-t bg-white'
              // Styling to customize the height and animations of each bar.
              style={{
                height: '16px', // Fixed height for all bars.
                animationName: isPlaying ? 'bounce' : 'none',
                animationDuration: isPlaying ? `${1 + bar * 0.1}s` : '0s', // Vary animation duration slightly for each bar.
                animationTimingFunction: 'ease-in-out', // Use an ease-in-out timing function for smooth animation.
                animationIterationCount: 'infinite', // Run the animation infinitely.
                animationDelay: `${bar * 0.1}s`, // Delay each bar's animation start time slightly.
              }}
            />
          ))}
        </div>
      </div>
    </div> // End of the main container for TTSIcon.
  );
};

export default TTSIcon;
