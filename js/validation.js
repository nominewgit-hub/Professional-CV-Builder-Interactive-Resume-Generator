// ============================================
// UPDATED VALIDATION UTILITIES
// ============================================

class FormValidator {
    constructor() {
        this.rules = {
            required: this.validateRequired,
            email: this.validateEmail,
            phone: this.validatePhone,
            number: this.validateNumber,
            minLength: this.validateMinLength,
            maxLength: this.validateMaxLength,
            url: this.validateURL
        };
    }

    validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    validateEmail(value) {
        if (!value) return true; // Empty is okay if not required
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value.trim());
    }

    validatePhone(value) {
        if (!value) return true; // Empty is okay if not required
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
        const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanedPhone);
    }

    validateNumber(value) {
        if (!value) return true; // Empty is okay if not required
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    validateMinLength(value, min) {
        if (!value) return true; // Empty is okay if not required
        return value.toString().trim().length >= parseInt(min);
    }

    validateMaxLength(value, max) {
        if (!value) return true; // Empty is okay if not required
        return value.toString().trim().length <= parseInt(max);
    }

    validateURL(value) {
        if (!value) return true; // Empty is okay if not required
        try {
            new URL(value.trim());
            return true;
        } catch {
            return false;
        }
    }

    validateField(input) {
        const validationString = input.getAttribute('data-validate');
        if (!validationString) return { isValid: true, errors: [] };

        const rules = validationString.split('|');
        const errors = [];
        const value = input.value.trim();

        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            
            if (this.rules[ruleName]) {
                const isValid = param 
                    ? this.rules[ruleName](value, param)
                    : this.rules[ruleName](value);
                
                if (!isValid) {
                    errors.push({ rule: ruleName, param });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getErrorMessage(rule, param = null) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number (e.g., +1 234 567 8900)',
            number: 'Please enter a valid number',
            minLength: `Minimum ${param} characters required`,
            maxLength: `Maximum ${param} characters allowed`,
            url: 'Please enter a valid URL (e.g., https://example.com)'
        };

        return messages[rule] || 'Invalid value';
    }
}

// ============================================
// REAL-TIME VALIDATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const validator = new FormValidator();
    
    // Add real-time validation to all inputs with data-validate
    document.querySelectorAll('[data-validate]').forEach(input => {
        // Validate on blur
        input.addEventListener('blur', () => {
            validateSingleField(input);
        });
        
        // Clear error on input
        input.addEventListener('input', (e) => {
            clearFieldError(input);
            
            // Auto-format phone number
            if (input.name === 'phone' && e.target.value) {
                formatPhoneNumber(e.target);
            }
        });
    });
    
    function validateSingleField(input) {
        const result = validator.validateField(input);
        const errorElement = input.parentElement.querySelector('.error-message');
        
        if (errorElement) {
            if (!result.isValid) {
                const errorMessage = validator.getErrorMessage(result.errors[0].rule, result.errors[0].param);
                errorElement.textContent = errorMessage;
                errorElement.classList.add('show');
                input.classList.add('error');
            } else {
                clearFieldError(input);
            }
        }
    }
    
    function clearFieldError(input) {
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
            errorElement.textContent = '';
        }
        input.classList.remove('error');
    }
    
    function formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        
        input.value = value;
    }
});