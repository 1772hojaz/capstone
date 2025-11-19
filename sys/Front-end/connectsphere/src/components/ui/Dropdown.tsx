import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'relative w-full flex items-center justify-between rounded-lg border bg-white px-4 py-2 text-sm text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          error
            ? 'border-danger-500'
            : 'border-gray-200 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn(!selectedOption && 'text-gray-400')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg animate-slideDown max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={option.disabled}
              className={cn(
                'w-full px-4 py-2 text-left text-sm transition-colors',
                option.value === value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-xs text-danger-600">{error}</p>}
    </div>
  );
};

export { Dropdown };


