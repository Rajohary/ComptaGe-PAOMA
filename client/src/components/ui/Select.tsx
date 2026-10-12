import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, options, className = '', ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-sans font-medium text-text-primary">
            {label}
            {props.required && <span className="text-status-alert ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-3 py-2 text-sm font-sans bg-surface-card border rounded transition-colors text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
            error
              ? 'border-status-alert focus:ring-status-alert'
              : 'border-border-subtle hover:border-text-secondary/40'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-card text-text-primary">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-status-alert mt-1 font-sans">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-text-secondary mt-1 font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
