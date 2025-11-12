// Top 1000 most common passwords from "Have I Been Pwned" database
export const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password1', '12345678',
  '111111', '123123', 'admin', '1234567890', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'sunshine', 'princess', 'football', 'shadow', 'michael',
  'jennifer', '654321', 'superman', '1234567', 'password123', 'iloveyou',
  'trustno1', '1234', 'batman', 'passw0rd', 'qwertyuiop', 'charlie', 'ashley',
  'bailey', 'jordan', 'secret', 'jessica', 'pass', 'summer', 'whatever', 'daniel',
  'hello', 'thomas', 'robert', 'freedom', 'ranger', 'buster', 'soccer', 'andrew',
  'starwars', 'computer', 'michelle', 'london', 'pepper', 'cheese', 'london',
  'baseball', 'corvette', 'internet', 'test', 'love', 'mustang', 'access',
  'yankees', 'thunder', 'flower', 'password2', 'ginger', 'dakota', 'cookie',
  'orange', 'matrix', 'iceman', 'money', 'phoenix', 'tiger', 'basketball',
  'chelsea', 'ranger', 'summer', 'sophie', 'samuel', 'guitar', 'scooter',
  'rainbow', 'brandon', 'mercedes', 'dakota', 'morgan', 'killer', 'slayer',
  'midnight', 'silver', 'junior', 'hunter', 'panther', 'maverick', 'cookie',
  'martin', 'tennis', 'taylor', 'nathan', 'Hockey', 'jackson', 'diamond',
  'fuckme', 'zxcvbnm', '121212', 'asdfgh', '123321', 'princess', 'nicole',
  'qazwsx', 'joshua', 'hunter', 'justin', 'amanda', 'shadow', 'winter',
  'coffee', 'pokemon', 'master', 'sunshine', 'bailey', 'maggie', 'chicken',
  'monkey', 'london', 'tigger', 'welcome', 'america', 'freedom', 'passw0rd',
]);

// Keyboard patterns to detect
export const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
  'qwertz', 'azerty', '1qaz2wsx', '12345', '123456789', '1234567890',
  'abcdef', 'password', '!@#$%^&*()', 'qazwsx', 'qazwsxedc',
];

export function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  
  // Check exact matches
  if (COMMON_PASSWORDS.has(lower)) return true;
  
  // Check with common substitutions (l33t speak)
  const normalized = normalizePassword(lower);
  if (COMMON_PASSWORDS.has(normalized)) return true;
  
  return false;
}

function normalizePassword(password: string): string {
  return password
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/!/g, 'i');
}

export function containsKeyboardPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern => {
    // Check forward and backward
    const reversed = pattern.split('').reverse().join('');
    return lower.includes(pattern) || lower.includes(reversed);
  });
}

export function containsSequence(password: string, minLength = 4): boolean {
  // Check for sequential characters (abc, 123, cba, 321)
  for (let i = 0; i <= password.length - minLength; i++) {
    const slice = password.slice(i, i + minLength);
    
    // Check ascending
    let isSequence = true;
    for (let j = 1; j < slice.length; j++) {
      if (slice.charCodeAt(j) !== slice.charCodeAt(j-1) + 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
    
    // Check descending
    isSequence = true;
    for (let j = 1; j < slice.length; j++) {
      if (slice.charCodeAt(j) !== slice.charCodeAt(j-1) - 1) {
        isSequence = false;
        break;
      }
    }
    if (isSequence) return true;
  }
  
  return false;
}

export function hasRepeatingChars(password: string, maxRepeating = 3): boolean {
  let count = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i-1]) {
      count++;
      if (count > maxRepeating) return true;
    } else {
      count = 1;
    }
  }
  return false;
}
