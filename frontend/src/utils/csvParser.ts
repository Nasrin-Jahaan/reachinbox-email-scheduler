export interface ParseEmailsResult {
  validEmails: string[];
  invalidEmails: string[];
  totalDetected: number;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function parseEmailsFromText(text: string): ParseEmailsResult {
  // Split on commas, newlines, semicolons, or whitespace
  const rawTokens = text.split(/[\r\n,;\s]+/);
  
  const validSet = new Set<string>();
  const invalidSet = new Set<string>();

  for (let token of rawTokens) {
    token = token.trim().replace(/^["']|["']$/g, ''); // strip quotes
    if (!token) continue;

    if (EMAIL_REGEX.test(token)) {
      validSet.add(token.toLowerCase());
    } else if (token.includes('@')) {
      invalidSet.add(token);
    }
  }

  const validEmails = Array.from(validSet);
  const invalidEmails = Array.from(invalidSet);

  return {
    validEmails,
    invalidEmails,
    totalDetected: validEmails.length + invalidEmails.length,
  };
}

export function parseFileContent(file: File): Promise<ParseEmailsResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        resolve(parseEmailsFromText(content));
      } else {
        resolve({ validEmails: [], invalidEmails: [], totalDetected: 0 });
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
