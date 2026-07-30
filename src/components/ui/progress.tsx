/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        className={`relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-brand-primary transition-all duration-500 ease-in-out"
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";
