export interface PasswordContext {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface PasswordConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minUppercase: number;
  minLowercase: number;
  minNumbers: number;
  minSpecialChars: number;
  checkCommonPasswords: boolean;
  checkKeyboardPatterns: boolean;
  checkSequences: boolean;
  checkRepeatingChars: boolean;
  checkUserInfo: boolean;
  maxRepeatingChars: number;
  minUniqueChars: number;
  allowedSpecialChars: string;
  strengthThreshold: 'weak' | 'medium' | 'strong';
}

export const DEFAULT_PASSWORD_CONFIG: PasswordConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minUppercase: 1,
  minLowercase: 1,
  minNumbers: 1,
  minSpecialChars: 1,
  checkCommonPasswords: true,
  checkKeyboardPatterns: true,
  checkSequences: true,
  checkRepeatingChars: true,
  checkUserInfo: true,
  maxRepeatingChars: 3,
  minUniqueChars: 5,
  allowedSpecialChars: '!@#$%^&*(),.?":{}|<>-_=+[]\\;\'`~',
  strengthThreshold: 'medium',
};

export const PASSWORD_PRESETS: Record<string, Partial<PasswordConfig>> = {
  basic: {
    minLength: 6,
    requireUppercase: false,
    requireSpecialChars: false,
    checkCommonPasswords: false,
    checkKeyboardPatterns: false,
    strengthThreshold: 'weak',
  },
  standard: DEFAULT_PASSWORD_CONFIG,
  strict: {
    minLength: 12,
    minUppercase: 2,
    minLowercase: 2,
    minNumbers: 2,
    minSpecialChars: 2,
    checkCommonPasswords: true,
    checkKeyboardPatterns: true,
    checkSequences: true,
    checkRepeatingChars: true,
    checkUserInfo: true,
    maxRepeatingChars: 2,
    minUniqueChars: 8,
    strengthThreshold: 'strong',
  },
};
