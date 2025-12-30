// Product validation schema
export const productSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9\s-_]+$/,
    message: 'Product name is required (2-255 chars, letters, numbers, spaces, hyphens, underscores only)'
  },
  sku: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9-_]+$/,
    message: 'SKU is required (3-50 chars, uppercase letters, numbers, hyphens, underscores only)'
  },
  description: {
    maxLength: 1000,
    pattern: /^[a-zA-Z0-9\s.,!?-_()]+$/,
    message: 'Description must be less than 1000 characters (letters, numbers, basic punctuation only)'
  },
  price: {
    required: true,
    type: 'number',
    min: 0.01,
    max: 999999.99,
    message: 'Price is required (0.01 - 999999.99)'
  },
  category_id: {
    required: true,
    type: 'number',
    min: 1,
    message: 'Category selection is required'
  },
  image_url: {
    pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i,
    message: 'Image URL must be a valid HTTP/HTTPS URL ending with jpg, jpeg, png, gif, or webp'
  }
};

// Category validation schema
export const categorySchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 150,
    pattern: /^[a-zA-Z0-9\s-_&]+$/,
    message: 'Category name is required (2-150 chars, letters, numbers, spaces, hyphens, underscores, & only)'
  },
  description: {
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s.,!?-_()&]+$/,
    message: 'Description must be less than 500 characters (letters, numbers, basic punctuation only)'
  },
  display_order: {
    type: 'number',
    min: 0,
    max: 9999,
    message: 'Display order must be a number between 0-9999'
  }
};

// User registration schema
export const registerSchema = {
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 255,
    message: 'Valid email is required (max 255 characters)'
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    message: 'Password must be 8-100 characters with lowercase, uppercase, number, and special character (@$!%*?&)'
  },
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'First name is required (2-50 characters, letters only)'
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'Last name is required (2-50 characters, letters only)'
  },
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Phone number must be valid international format (+1234567890, 10-15 digits)'
  },
  address: {
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s.,#-]+$/,
    message: 'Address must be less than 500 characters (letters, numbers, spaces, basic punctuation only)'
  }
};

// Login schema
export const loginSchema = {
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message: 'Valid email is required'
  },
  password: {
    required: true,
    minLength: 1,
    message: 'Password is required'
  }
};

// Profile update schema
export const profileSchema = {
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'First name is required (2-50 characters, letters only)'
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'Last name is required (2-50 characters, letters only)'
  },
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    message: 'Phone number must be valid international format (+1234567890, 10-15 digits)'
  },
  address: {
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s.,#-]+$/,
    message: 'Address must be less than 500 characters (letters, numbers, spaces, basic punctuation only)'
  }
};

// Admin user creation schema
export const adminUserSchema = {
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    maxLength: 255,
    message: 'Valid email is required (max 255 characters)'
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    message: 'Password must be 8-100 characters with lowercase, uppercase, number, and special character (@$!%*?&)'
  },
  first_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'First name is required (2-50 characters, letters only)'
  },
  last_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z]+$/,
    message: 'Last name is required (2-50 characters, letters only)'
  }
};

// Validation function
export const validateField = (value, rules) => {
  if (!rules) return null;
  
  // Required check
  if (rules.required && (!value || value.toString().trim() === '')) {
    return rules.message || 'This field is required';
  }
  
  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') return null;
  
  const stringValue = value.toString();
  
  // Length checks
  if (rules.minLength && stringValue.length < rules.minLength) {
    return rules.message || `Minimum length is ${rules.minLength}`;
  }
  
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return rules.message || `Maximum length is ${rules.maxLength}`;
  }
  
  // Pattern check
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return rules.message || 'Invalid format';
  }
  
  // Number checks
  if (rules.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return rules.message || 'Must be a valid number';
    }
    if (rules.min !== undefined && numValue < rules.min) {
      return rules.message || `Minimum value is ${rules.min}`;
    }
    if (rules.max !== undefined && numValue > rules.max) {
      return rules.message || `Maximum value is ${rules.max}`;
    }
  }
  
  return null;
};

// Validate entire form
export const validateForm = (formData, schema) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(schema).forEach(field => {
    const error = validateField(formData[field], schema[field]);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  });
  
  // Special validation for password confirmation
  if (schema === registerSchema && formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords don't match";
    isValid = false;
  }
  
  return { isValid, errors };
};

// Real-time field validation
export const validateFieldRealTime = (name, value, schema) => {
  if (!schema[name]) return null;
  return validateField(value, schema[name]);
};

// Input sanitization
export const sanitizeInput = (value, fieldType) => {
  if (!value) return value;
  
  switch (fieldType) {
    case 'name':
      return value.replace(/[^a-zA-Z]/g, '');
    case 'sku':
      return value.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    case 'phone':
      return value.replace(/[^+0-9]/g, '');
    case 'email':
      return value.toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
    case 'alphanumeric':
      return value.replace(/[^a-zA-Z0-9\s-_]/g, '');
    case 'text':
      return value.replace(/[^a-zA-Z0-9\s.,!?-_()&]/g, '');
    case 'address':
      return value.replace(/[^a-zA-Z0-9\s.,#-]/g, '');
    default:
      return value;
  }
};