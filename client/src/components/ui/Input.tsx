import React from 'react';
import { formatThousandsInput } from '../../lib/formatters';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  formatThousands?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', formatThousands = false, onChange, ...props }, ref) => {
    const inputId = id || props.name;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (formatThousands) {
        const input = e.target;
        const previousValue = input.value;
        const cursorPosition = input.selectionStart || 0;

        // Compter les caractères non-espaces avant le curseur
        const nonSpacesBefore = previousValue.slice(0, cursorPosition).replace(/\s/g, '').length;

        // Formater la valeur avec des espaces comme séparateurs de milliers
        const formatted = formatThousandsInput(previousValue);
        input.value = formatted;

        // Recalculer la position du curseur
        let newCursor = 0;
        let countedNonSpaces = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (countedNonSpaces === nonSpacesBefore) {
            newCursor = i;
            break;
          }
          if (formatted[i] !== ' ') {
            countedNonSpaces++;
          }
          if (countedNonSpaces === nonSpacesBefore) {
            newCursor = i + 1;
            break;
          }
        }

        // Fixer la position du curseur après la mise à jour
        requestAnimationFrame(() => {
          input.setSelectionRange(newCursor, newCursor);
        });
      }

      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-sans font-medium text-text-primary">
            {label}
            {props.required && <span className="text-status-alert ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm font-sans bg-surface-card border rounded transition-colors text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent ${
            error
              ? 'border-status-alert focus:ring-status-alert'
              : 'border-border-subtle hover:border-text-secondary/40'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-status-alert mt-1 font-sans">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-text-secondary mt-1 font-sans">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
