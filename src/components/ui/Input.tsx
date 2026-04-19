import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          className={cn(
            'rounded-lg border bg-white dark:bg-navy-900 text-navy-950 dark:text-white px-3 py-2',
            'placeholder:text-navy-400',
            'focus:outline-none focus:ring-2 focus:ring-accent-500',
            'disabled:opacity-50 disabled:pointer-events-none',
            error
              ? 'border-red-500'
              : 'border-navy-300 dark:border-navy-700',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
