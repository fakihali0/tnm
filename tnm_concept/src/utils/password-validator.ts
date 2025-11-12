import { PasswordConfig, PasswordContext, DEFAULT_PASSWORD_CONFIG } from './password-config';
import { 
  isCommonPassword, 
  containsKeyboardPattern, 
  containsSequence,
  hasRepeatingChars 
} from './common-passwords';

export interface ValidationCheck {
  passed: boolean;
  message: string;
  weight: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  errors: string[];
  warnings: string[];
  checks: Record<string, ValidationCheck>;
}

export class PasswordValidator {
  private config: PasswordConfig;

  constructor(config: Partial<PasswordConfig> = {}) {
    this.config = { ...DEFAULT_PASSWORD_CONFIG, ...config };
  }

  validate(password: string, context?: PasswordContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks: Record<string, ValidationCheck> = {};
    let score = 0;

    // Length check (required)
    const lengthCheck = this.checkLength(password);
    checks.length = lengthCheck;
    if (!lengthCheck.passed) {
      errors.push(lengthCheck.message);
    } else {
      score += lengthCheck.weight;
    }

    // Character type checks
    if (this.config.requireUppercase) {
      const check = this.checkUppercase(password);
      checks.uppercase = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    if (this.config.requireLowercase) {
      const check = this.checkLowercase(password);
      checks.lowercase = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    if (this.config.requireNumbers) {
      const check = this.checkNumbers(password);
      checks.numbers = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    if (this.config.requireSpecialChars) {
      const check = this.checkSpecialChars(password);
      checks.specialChars = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    // Common password check
    if (this.config.checkCommonPasswords) {
      const check = this.checkCommonPassword(password);
      checks.commonPassword = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    // Keyboard pattern check
    if (this.config.checkKeyboardPatterns) {
      const check = this.checkKeyboardPattern(password);
      checks.keyboardPattern = check;
      if (!check.passed) warnings.push(check.message);
      else score += check.weight;
    }

    // Sequence check
    if (this.config.checkSequences) {
      const check = this.checkSequence(password);
      checks.sequence = check;
      if (!check.passed) warnings.push(check.message);
      else score += check.weight;
    }

    // Repeating characters check
    if (this.config.checkRepeatingChars) {
      const check = this.checkRepeatingChars(password);
      checks.repeatingChars = check;
      if (!check.passed) warnings.push(check.message);
      else score += check.weight;
    }

    // User info check
    if (this.config.checkUserInfo && context) {
      const check = this.checkUserInfo(password, context);
      checks.userInfo = check;
      if (!check.passed) errors.push(check.message);
      else score += check.weight;
    }

    // Unique characters check
    const uniqueCheck = this.checkUniqueChars(password);
    checks.uniqueChars = uniqueCheck;
    if (!uniqueCheck.passed) warnings.push(uniqueCheck.message);
    else score += uniqueCheck.weight;

    // Calculate strength
    const strength = this.calculateStrength(score);

    // Determine if valid based on strength threshold
    const isValid = errors.length === 0 && this.meetsStrengthThreshold(strength);

    return {
      isValid,
      score,
      strength,
      errors,
      warnings,
      checks
    };
  }

  private checkLength(password: string): ValidationCheck {
    const passed = password.length >= this.config.minLength && 
                   password.length <= this.config.maxLength;
    return {
      passed,
      message: passed 
        ? `Length requirement met (${this.config.minLength}+ characters)` 
        : `Password must be at least ${this.config.minLength} characters`,
      weight: 15
    };
  }

  private checkUppercase(password: string): ValidationCheck {
    const count = (password.match(/[A-Z]/g) || []).length;
    const passed = count >= this.config.minUppercase;
    return {
      passed,
      message: passed
        ? 'Contains uppercase letters'
        : `Must contain at least ${this.config.minUppercase} uppercase letter(s)`,
      weight: 10
    };
  }

  private checkLowercase(password: string): ValidationCheck {
    const count = (password.match(/[a-z]/g) || []).length;
    const passed = count >= this.config.minLowercase;
    return {
      passed,
      message: passed
        ? 'Contains lowercase letters'
        : `Must contain at least ${this.config.minLowercase} lowercase letter(s)`,
      weight: 10
    };
  }

  private checkNumbers(password: string): ValidationCheck {
    const count = (password.match(/\d/g) || []).length;
    const passed = count >= this.config.minNumbers;
    return {
      passed,
      message: passed
        ? 'Contains numbers'
        : `Must contain at least ${this.config.minNumbers} number(s)`,
      weight: 10
    };
  }

  private checkSpecialChars(password: string): ValidationCheck {
    const specialCharsRegex = new RegExp(
      `[${this.config.allowedSpecialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`,
      'g'
    );
    const count = (password.match(specialCharsRegex) || []).length;
    const passed = count >= this.config.minSpecialChars;
    return {
      passed,
      message: passed
        ? 'Contains special characters'
        : `Must contain at least ${this.config.minSpecialChars} special character(s)`,
      weight: 15
    };
  }

  private checkCommonPassword(password: string): ValidationCheck {
    const passed = !isCommonPassword(password);
    return {
      passed,
      message: passed
        ? 'Not a common password'
        : 'This password is too common and easily guessed',
      weight: 20
    };
  }

  private checkKeyboardPattern(password: string): ValidationCheck {
    const passed = !containsKeyboardPattern(password);
    return {
      passed,
      message: passed
        ? 'No keyboard patterns detected'
        : 'Avoid keyboard patterns like "qwerty" or "12345"',
      weight: 10
    };
  }

  private checkSequence(password: string): ValidationCheck {
    const passed = !containsSequence(password);
    return {
      passed,
      message: passed
        ? 'No sequential characters'
        : 'Avoid sequential characters like "abc" or "123"',
      weight: 5
    };
  }

  private checkRepeatingChars(password: string): ValidationCheck {
    const passed = !hasRepeatingChars(password, this.config.maxRepeatingChars);
    return {
      passed,
      message: passed
        ? 'No excessive repeating characters'
        : `Avoid repeating the same character more than ${this.config.maxRepeatingChars} times`,
      weight: 5
    };
  }

  private checkUserInfo(password: string, context: PasswordContext): ValidationCheck {
    const lower = password.toLowerCase();
    const infoStrings = [
      context.email?.split('@')[0].toLowerCase(),
      context.firstName?.toLowerCase(),
      context.lastName?.toLowerCase(),
      context.username?.toLowerCase()
    ].filter(Boolean) as string[];

    const containsUserInfo = infoStrings.some(info => 
      info && info.length > 2 && (lower.includes(info) || info.includes(lower))
    );

    return {
      passed: !containsUserInfo,
      message: containsUserInfo
        ? 'Password should not contain your personal information'
        : 'Does not contain personal information',
      weight: 10
    };
  }

  private checkUniqueChars(password: string): ValidationCheck {
    const uniqueChars = new Set(password).size;
    const passed = uniqueChars >= this.config.minUniqueChars;
    return {
      passed,
      message: passed
        ? 'Good character diversity'
        : `Use at least ${this.config.minUniqueChars} different characters`,
      weight: 10
    };
  }

  private calculateStrength(score: number): ValidationResult['strength'] {
    if (score >= 90) return 'very-strong';
    if (score >= 70) return 'strong';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'weak';
    return 'very-weak';
  }

  private meetsStrengthThreshold(strength: ValidationResult['strength']): boolean {
    const levels: ValidationResult['strength'][] = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'];
    const currentLevel = levels.indexOf(strength);
    const requiredLevel = levels.indexOf(this.config.strengthThreshold);
    return currentLevel >= requiredLevel;
  }

  updateConfig(config: Partial<PasswordConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PasswordConfig {
    return { ...this.config };
  }
}

// Singleton instance with default config
export const defaultPasswordValidator = new PasswordValidator();

// Helper function for easy validation
export function validatePassword(
  password: string, 
  context?: PasswordContext,
  config?: Partial<PasswordConfig>
): ValidationResult {
  const validator = config 
    ? new PasswordValidator(config) 
    : defaultPasswordValidator;
  return validator.validate(password, context);
}
