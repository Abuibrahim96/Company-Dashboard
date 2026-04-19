import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-navy-600 dark:text-navy-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'rounded-lg border border-navy-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-950 dark:text-white px-3 py-2',
            'placeholder:text-navy-400',
            'focus:outline-none focus:ring-2 focus:ring-accent-500',
            'disabled:opacity-50 disabled:pointer-events-none',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
