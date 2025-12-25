'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * SelectField
 * - Drop-in replacement for a native <select> in client components.
 * - Supports label, error, placeholder, options, required, name.
 * - onChange receives a native-like event shape: { target: { name, value } }
 */
export function SelectField({
  label,
  error,
  options = [],
  placeholder,
  showPlaceholderOption = false,
  className,
  triggerProps,
  contentProps,
  id,
  name,
  required,
  value,
  defaultValue,
  disabled,
  onChange,
  onValueChange,
  ...props
}) {
  const isControlled = value !== undefined;
  const triggerId = id || name;

  const EMPTY_VALUE = '__radix_empty__';
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue === undefined || defaultValue === null ? '' : String(defaultValue)
  );

  const currentValue = isControlled
    ? (value === '' || value === null ? EMPTY_VALUE : String(value))
    : (uncontrolledValue === '' ? EMPTY_VALUE : String(uncontrolledValue));

  const normalize = (nextValue) => (nextValue === EMPTY_VALUE ? '' : nextValue);

  const handleValueChange = (nextValue) => {
    const normalized = normalize(nextValue);

    if (!isControlled) {
      setUncontrolledValue(normalized);
    }

    onValueChange?.(normalized);

    if (onChange) {
      onChange({
        target: {
          name,
          value: normalized,
        },
        currentTarget: {
          name,
          value: normalized,
        },
      });
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={triggerId}
          className={cn('block text-sm font-medium', error ? 'text-red-700' : 'text-gray-700')}
        >
          {label}
        </label>
      )}

      {/* Visually hidden native select so forms + required validation work */}
      {name ? (
        <select
          tabIndex={-1}
          aria-hidden="true"
          name={name}
          required={required}
          value={isControlled ? (value === null || value === undefined ? '' : String(value)) : uncontrolledValue}
          onChange={() => {}}
          className="sr-only"
        >
          {placeholder ? <option value="">{placeholder}</option> : <option value="" />}
          {options.map((option) => (
            <option key={option.value} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      <Select
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger
          id={triggerId}
          className={cn(
            error && 'border-red-300 focus:ring-red-500/40 focus:border-red-500',
            className
          )}
          {...triggerProps}
        >
          {currentValue === EMPTY_VALUE ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>

        <SelectContent {...contentProps}>
          {placeholder ? (
            showPlaceholderOption ? (
              <SelectItem value={EMPTY_VALUE}>{placeholder}</SelectItem>
            ) : (
              <SelectItem value={EMPTY_VALUE} disabled className="hidden">
                {placeholder}
              </SelectItem>
            )
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
