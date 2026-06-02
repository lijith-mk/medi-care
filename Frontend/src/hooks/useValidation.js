import { useState, useCallback } from 'react';

// ── Rules ────────────────────────────────────────────────────────────────────
export const rules = {
  required: (label) => (v) => (!v || !String(v).trim()) ? `${label} is required` : '',

  email: () => (v) => {
    if (!v) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address';
  },

  minLen: (n) => (v) => {
    if (!v) return '';
    return String(v).length >= n ? '' : `Must be at least ${n} characters`;
  },

  maxLen: (n) => (v) => {
    if (!v) return '';
    return String(v).length <= n ? '' : `Must be ${n} characters or fewer`;
  },

  // Password: min 8 chars, at least one letter and one number
  password: () => (v) => {
    if (!v) return '';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Za-z]/.test(v)) return 'Password must contain at least one letter';
    if (!/\d/.test(v)) return 'Password must contain at least one number';
    return '';
  },

  // Indian mobile: 10 digits, starts with 6-9, optional +91 or 0 prefix
  indianPhone: (optional = true) => (v) => {
    if (!v || !String(v).trim()) return optional ? '' : 'Phone number is required';
    const stripped = String(v).replace(/\s+/g, '').replace(/^(\+91|0)/, '');
    return /^[6-9]\d{9}$/.test(stripped) ? '' : 'Enter a valid 10-digit Indian mobile number';
  },

  age: () => (v) => {
    if (!v) return '';
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 120) return 'Age must be between 1 and 120';
    return '';
  },

  positiveNumber: (label) => (v) => {
    if (!v) return '';
    if (Number(v) < 0) return `${label} cannot be negative`;
    return '';
  },

  heightCm: () => (v) => {
    if (!v) return '';
    const n = Number(v);
    if (n < 50 || n > 250) return 'Height must be between 50 and 250 cm';
    return '';
  },

  weightKg: () => (v) => {
    if (!v) return '';
    const n = Number(v);
    if (n < 1 || n > 500) return 'Weight must be between 1 and 500 kg';
    return '';
  },

  name: (label) => (v) => {
    if (!v || !String(v).trim()) return `${label} is required`;
    if (String(v).trim().length < 2) return `${label} must be at least 2 characters`;
    return '';
  },
};

// Compose multiple rule functions — returns first error found
export function compose(...fns) {
  return (v) => {
    for (const fn of fns) {
      const err = fn(v);
      if (err) return err;
    }
    return '';
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
/**
 * schema: { fieldName: validatorFn }
 * Returns { errors, touched, validate, touch, touchAll, isValid }
 */
export default function useValidation(schema) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate a single field and update errors state
  const validateField = useCallback((name, value) => {
    const fn = schema[name];
    if (!fn) return '';
    const err = fn(value);
    setErrors((prev) => ({ ...prev, [name]: err }));
    return err;
  }, [schema]);

  // Touch a field (on blur) and validate it
  const touch = useCallback((name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  }, [validateField]);

  // Validate all fields at once (for submit)
  const touchAll = useCallback((values) => {
    const newErrors = {};
    const newTouched = {};
    for (const name of Object.keys(schema)) {
      newTouched[name] = true;
      newErrors[name] = schema[name](values[name] ?? '');
    }
    setErrors(newErrors);
    setTouched(newTouched);
    return Object.values(newErrors).every((e) => !e);
  }, [schema]);

  const isValid = Object.values(errors).every((e) => !e);

  return { errors, touched, touch, touchAll, isValid, validateField };
}
