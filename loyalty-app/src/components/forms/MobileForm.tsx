'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Phone,
  Mail,
  User,
  Lock,
} from 'lucide-react';
import { pwaManager } from '@/lib/pwa';

interface FormField {
  id: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'date'
    | 'time'
    | 'select'
    | 'textarea'
    | 'number';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: string) => string | null;
  };
  options?: { value: string; label: string }[];
  icon?: React.ComponentType<any>;
}

interface MobileFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitLabel?: string;
  loading?: boolean;
  initialData?: Record<string, any>;
  className?: string;
}

export default function MobileForm({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  initialData = {},
  className = '',
}: MobileFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRefs = useRef<
    Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  >({});

  // Initialize form data
  useEffect(() => {
    const initialFormData: Record<string, any> = {};
    fields.forEach(field => {
      initialFormData[field.id] = initialData[field.id] || '';
    });
    setFormData(initialFormData);
  }, [fields, initialData]);

  // Handle input change
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));

    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }

    // Mark field as touched
    setTouched(prev => new Set(prev).add(fieldId));

    // Provide haptic feedback
    pwaManager.hapticFeedback('light');
  };

  // Handle input blur
  const handleInputBlur = (fieldId: string) => {
    setFocusedField(null);
    validateField(fieldId, formData[fieldId]);
  };

  // Handle input focus
  const handleInputFocus = (fieldId: string) => {
    setFocusedField(fieldId);
    pwaManager.hapticFeedback('light');
  };

  // Validate single field
  const validateField = (fieldId: string, value: any): string | null => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return null;

    // Required validation
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    // Skip other validations if empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Pattern validation
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} format is invalid`;
    }

    // Length validation
    if (
      field.validation?.minLength &&
      value.length < field.validation.minLength
    ) {
      return `${field.label} must be at least ${field.validation.minLength} characters`;
    }

    if (
      field.validation?.maxLength &&
      value.length > field.validation.maxLength
    ) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters`;
    }

    // Number validation
    if (field.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.label} must be a valid number`;
      }
      if (
        field.validation?.min !== undefined &&
        numValue < field.validation.min
      ) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (
        field.validation?.max !== undefined &&
        numValue > field.validation.max
      ) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
    }

    // Custom validation
    if (field.validation?.custom) {
      const customError = field.validation.custom(value);
      if (customError) return customError;
    }

    return null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const error = validateField(field.id, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      pwaManager.hapticFeedback('heavy');
      return;
    }

    pwaManager.hapticFeedback('medium');
    onSubmit(formData);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (fieldId: string) => {
    setShowPassword(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
    pwaManager.hapticFeedback('light');
  };

  // Handle field navigation
  const handleFieldNavigation = (
    currentIndex: number,
    direction: 'next' | 'prev'
  ) => {
    const nextIndex =
      direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < fields.length) {
      const nextField = fields[nextIndex];
      if (nextField) {
        const nextInput = inputRefs.current[nextField.id];
        if (nextInput) {
          nextInput.focus();
          pwaManager.hapticFeedback('light');
        }
      }
    }
  };

  // Render input field
  const renderField = (field: FormField, index: number) => {
    const Icon = field.icon;
    const hasError = errors[field.id];
    const isTouched = touched.has(field.id);
    const isFocused = focusedField === field.id;
    const showError = hasError && isTouched;

    const baseInputClasses = `
      w-full px-4 py-4 text-base bg-white border-2 rounded-2xl transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      ${
        showError
          ? 'border-red-500 focus:border-red-500'
          : isFocused
            ? 'border-blue-500'
            : 'border-gray-200'
      }
      ${field.type === 'textarea' ? 'resize-none' : ''}
    `;

    const inputProps = {
      id: field.id,
      ref: (el: any) => {
        if (el) inputRefs.current[field.id] = el;
      },
      type:
        field.type === 'password' && showPassword[field.id]
          ? 'text'
          : field.type,
      placeholder: field.placeholder,
      value: formData[field.id] || '',
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => handleInputChange(field.id, e.target.value),
      onBlur: () => handleInputBlur(field.id),
      onFocus: () => handleInputFocus(field.id),
      required: field.required,
      className: baseInputClasses,
      style: { touchAction: 'manipulation' },
    };

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="space-y-2"
      >
        {/* Label */}
        <label
          htmlFor={field.id}
          className="ml-1 block text-sm font-medium text-gray-700"
        >
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Icon */}
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 transform text-gray-400">
              <Icon size={20} />
            </div>
          )}

          {/* Input Field */}
          <div className={Icon ? 'pl-12' : ''}>
            {field.type === 'textarea' ? (
              <textarea
                {...inputProps}
                rows={4}
                className={`${baseInputClasses} pl-4`}
              />
            ) : field.type === 'select' ? (
              <select {...inputProps} className={`${baseInputClasses} pl-4`}>
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input {...inputProps} />
            )}
          </div>

          {/* Password Toggle */}
          {field.type === 'password' && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
              style={{ touchAction: 'manipulation' }}
            >
              {showPassword[field.id] ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          )}

          {/* Success/Error Icons */}
          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 transform text-red-500"
              >
                <X size={20} />
              </motion.div>
            )}
            {isTouched && !showError && formData[field.id] && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 transform text-green-500"
              >
                <Check size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-1 flex items-center space-x-2 text-sm text-red-600"
            >
              <AlertCircle size={16} />
              <span>{errors[field.id]}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Field Navigation */}
        <div className="flex justify-between pt-2">
          {index > 0 && (
            <button
              type="button"
              onClick={() => handleFieldNavigation(index, 'prev')}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              style={{ touchAction: 'manipulation' }}
            >
              <span>← Previous</span>
            </button>
          )}
          {index < fields.length - 1 && (
            <button
              type="button"
              onClick={() => handleFieldNavigation(index, 'next')}
              className="ml-auto flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              style={{ touchAction: 'manipulation' }}
            >
              <span>Next →</span>
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Form Fields */}
      {fields.map((field, index) => renderField(field, index))}

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={loading}
        className={`
          w-full transform rounded-2xl px-6 py-4 text-lg font-semibold
          text-white transition-all duration-200
          ${
            loading
              ? 'cursor-not-allowed bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          }
          focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
        `}
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        style={{ touchAction: 'manipulation' }}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Submitting...</span>
          </div>
        ) : (
          submitLabel
        )}
      </motion.button>

      {/* Form Status */}
      <AnimatePresence>
        {Object.keys(errors).length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 p-4"
          >
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={20} />
              <span className="font-medium">Please fix the errors above</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}

// Predefined field configurations
export const commonFields = {
  name: {
    id: 'name',
    label: 'Full Name',
    type: 'text' as const,
    placeholder: 'Enter your full name',
    required: true,
    validation: {
      minLength: 2,
      maxLength: 50,
    },
    icon: User,
  },
  email: {
    id: 'email',
    label: 'Email Address',
    type: 'email' as const,
    placeholder: 'Enter your email address',
    required: true,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    icon: Mail,
  },
  phone: {
    id: 'phone',
    label: 'Phone Number',
    type: 'tel' as const,
    placeholder: 'Enter your phone number',
    required: false,
    validation: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
    },
    icon: Phone,
  },
  password: {
    id: 'password',
    label: 'Password',
    type: 'password' as const,
    placeholder: 'Enter your password',
    required: true,
    validation: {
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value))
          return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value))
          return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value))
          return 'Password must contain at least one number';
        return null;
      },
    },
    icon: Lock,
  },
};
