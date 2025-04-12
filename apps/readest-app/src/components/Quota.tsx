import clsx from 'clsx';
import React from 'react';

/**
 * Defines the structure of a quota item, representing a single quota.
 */
type QuotaProps = {
  quotas: {
    name: string; // The name or description of the quota.
    tooltip: string; // Tooltip text to display more information about the quota.
    used: number; // The amount of the quota that has been used.
    total: number; // The total amount available for the quota.
    unit: string; // The unit of measurement for the quota (e.g., "GB", "requests").
  }[];
  className?: string; // Optional CSS classes to apply to the main container.
  showProgress?: boolean; // Whether to display a visual progress bar.
};

/**
 * The Quota component displays a list of quotas with their usage information.
 * It renders a visual progress bar (if enabled) and displays the used/total amount for each quota.
 *
 * @param {QuotaProps} props - The properties for the Quota component.
 * @returns {JSX.Element} - The rendered Quota component.
 */
const Quota: React.FC<QuotaProps> = ({ quotas, showProgress, className }) => {
  return (
    <div
      className={clsx('text-base-content w-full space-y-2 rounded-md text-base sm:text-sm')}
    >
      {/* Iterate over each quota to display its usage information */}
      {quotas.map((quota) => {
        const usagePercentage = (quota.used / quota.total) * 100;
        let bgColor = 'bg-green-500';
        if (usagePercentage > 80) {
          bgColor = 'bg-red-500';
        } else if (usagePercentage > 50) {
          bgColor = 'bg-yellow-500';
        }

        // Render the quota item
        return (
          <div
            key={quota.name}
            className={clsx(
              'relative w-full overflow-hidden rounded-md',
              showProgress && 'border-base-300 border',
              className
            )}
          >
            {showProgress && (
              <div
                className={`absolute left-0 top-0 h-full ${bgColor}`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            )}

            {/* Container for the quota name and usage stats */}
            <div className={'relative flex items-center justify-between p-2'}>
              {/* Tooltip for the quota name */}
              <div className='lg:tooltip lg:tooltip-bottom' data-tip={quota.tooltip}>
                {/* Quota Name */}
                <span className='truncate'>{quota.name}</span>
              </div>

              {/* Quota Used / Total */}
              {/*
               * The used and total quota value and its unit
               */}
              <div className='text-right text-xs'>
                {quota.used} / {quota.total} {quota.unit}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Quota;
