/**
 * DateTime Utility
 * Provides standardized datetime formatting functions
 */

export type DateInput = string | number | Date;

export interface DateFormatOptions {
  locale?: string;
  timezone?: string;
  includeTime?: boolean;
  format?: 'short' | 'medium' | 'long' | 'full';
}

export class DateTimeUtil {
  private static defaultLocale = 'en-US';
  private static defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  /**
   * Convert input to Date object
   */
  private static toDate(input: DateInput): Date {
    if (input instanceof Date) return input;
    return new Date(input);
  }

  /**
   * Check if date is valid
   */
  static isValidDate(input: DateInput): boolean {
    const date = this.toDate(input);
    return !isNaN(date.getTime());
  }

  /**
   * Format date to standard formats
   */
  static formatDate(input: DateInput, options: DateFormatOptions = {}): string {
    if (!this.isValidDate(input)) return 'Invalid Date';

    const date = this.toDate(input);
    const {
      locale = this.defaultLocale,
      timezone = this.defaultTimezone,
      includeTime = false,
      format = 'medium'
    } = options;

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    // Date part
    switch (format) {
      case 'short':
        formatOptions.year = '2-digit';
        formatOptions.month = 'numeric';
        formatOptions.day = 'numeric';
        break;
      case 'medium':
        formatOptions.year = 'numeric';
        formatOptions.month = 'short';
        formatOptions.day = 'numeric';
        break;
      case 'long':
        formatOptions.year = 'numeric';
        formatOptions.month = 'long';
        formatOptions.day = 'numeric';
        break;
      case 'full':
        formatOptions.weekday = 'long';
        formatOptions.year = 'numeric';
        formatOptions.month = 'long';
        formatOptions.day = 'numeric';
        break;
    }

    // Time part
    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.second = '2-digit';
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  }

  /**
   * Common date formats
   */
  
  // Short formats
  static toShortDate(input: DateInput): string {
    return this.formatDate(input, { format: 'short' });
  }

  static toShortDateTime(input: DateInput): string {
    return this.formatDate(input, { format: 'short', includeTime: true });
  }

  // Medium formats (default)
  static toMediumDate(input: DateInput): string {
    return this.formatDate(input, { format: 'medium' });
  }

  static toMediumDateTime(input: DateInput): string {
    return this.formatDate(input, { format: 'medium', includeTime: true });
  }

  // Long formats
  static toLongDate(input: DateInput): string {
    return this.formatDate(input, { format: 'long' });
  }

  static toLongDateTime(input: DateInput): string {
    return this.formatDate(input, { format: 'long', includeTime: true });
  }

  // Full formats
  static toFullDate(input: DateInput): string {
    return this.formatDate(input, { format: 'full' });
  }

  static toFullDateTime(input: DateInput): string {
    return this.formatDate(input, { format: 'full', includeTime: true });
  }

  /**
   * Time only formats
   */
  static toTime(input: DateInput, options: { locale?: string; format?: '12' | '24' } = {}): string {
    if (!this.isValidDate(input)) return 'Invalid Time';

    const date = this.toDate(input);
    const { locale = this.defaultLocale, format = '12' } = options;

    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12'
    };

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  }

  static toTimeWithSeconds(input: DateInput, options: { locale?: string; format?: '12' | '24' } = {}): string {
    if (!this.isValidDate(input)) return 'Invalid Time';

    const date = this.toDate(input);
    const { locale = this.defaultLocale, format = '12' } = options;

    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === '12'
    };

    return new Intl.DateTimeFormat(locale, formatOptions).format(date);
  }

  /**
   * Custom format patterns
   */
  static toCustomFormat(input: DateInput, pattern: string): string {
    if (!this.isValidDate(input)) return 'Invalid Date';

    const date = this.toDate(input);
    
    const replacements: Record<string, string> = {
      'YYYY': date.getFullYear().toString(),
      'YY': date.getFullYear().toString().slice(-2),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'M': (date.getMonth() + 1).toString(),
      'DD': date.getDate().toString().padStart(2, '0'),
      'D': date.getDate().toString(),
      'HH': date.getHours().toString().padStart(2, '0'),
      'H': date.getHours().toString(),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'm': date.getMinutes().toString(),
      'ss': date.getSeconds().toString().padStart(2, '0'),
      's': date.getSeconds().toString(),
    };

    let result = pattern;
    Object.entries(replacements).forEach(([key, value]) => {
      result = result.replace(new RegExp(key, 'g'), value);
    });

    return result;
  }

  /**
   * Relative time formatting
   */
  static toRelativeTime(input: DateInput, options: { locale?: string } = {}): string {
    if (!this.isValidDate(input)) return 'Invalid Date';

    const date = this.toDate(input);
    const now = new Date();
    const { locale = this.defaultLocale } = options;

    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    // Use Intl.RelativeTimeFormat for proper localization
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInMinutes) < 1) {
      return 'just now';
    } else if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(-diffInMinutes, 'minute');
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(-diffInHours, 'hour');
    } else if (Math.abs(diffInDays) < 30) {
      return rtf.format(-diffInDays, 'day');
    } else {
      // For dates older than 30 days, show actual date
      return this.toMediumDate(date);
    }
  }

  /**
   * ISO format
   */
  static toISOString(input: DateInput): string {
    if (!this.isValidDate(input)) return 'Invalid Date';
    return this.toDate(input).toISOString();
  }

  static toISODate(input: DateInput): string {
    if (!this.isValidDate(input)) return 'Invalid Date';
    return this.toDate(input).toISOString().split('T')[0];
  }

  /**
   * Common application formats
   */
  
  // Table display formats
  static forTable(input: DateInput): string {
    return this.toMediumDate(input);
  }

  static forTableWithTime(input: DateInput): string {
    return this.toMediumDateTime(input);
  }

  // Form input formats
  static forDateInput(input: DateInput): string {
    return this.toISODate(input);
  }

  static forDateTimeInput(input: DateInput): string {
    if (!this.isValidDate(input)) return '';
    const date = this.toDate(input);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  }

  // API formats
  static forAPI(input: DateInput): string {
    return this.toISOString(input);
  }

  // Display formats
  static forDisplay(input: DateInput): string {
    return this.toLongDate(input);
  }

  static forDisplayWithTime(input: DateInput): string {
    return this.toLongDateTime(input);
  }

  /**
   * Utility functions
   */
  
  static startOfDay(input: DateInput): Date {
    const date = this.toDate(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  static endOfDay(input: DateInput): Date {
    const date = this.toDate(input);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  static addDays(input: DateInput, days: number): Date {
    const date = this.toDate(input);
    date.setDate(date.getDate() + days);
    return date;
  }

  static addHours(input: DateInput, hours: number): Date {
    const date = this.toDate(input);
    date.setHours(date.getHours() + hours);
    return date;
  }

  static addMinutes(input: DateInput, minutes: number): Date {
    const date = this.toDate(input);
    date.setMinutes(date.getMinutes() + minutes);
    return date;
  }
}

// Export commonly used functions as standalone functions
export const {
  isValidDate,
  formatDate,
  toShortDate,
  toShortDateTime,
  toMediumDate,
  toMediumDateTime,
  toLongDate,
  toLongDateTime,
  toFullDate,
  toFullDateTime,
  toTime,
  toTimeWithSeconds,
  toCustomFormat,
  toRelativeTime,
  toISOString,
  toISODate,
  forTable,
  forTableWithTime,
  forDateInput,
  forDateTimeInput,
  forAPI,
  forDisplay,
  forDisplayWithTime,
  startOfDay,
  endOfDay,
  addDays,
  addHours,
  addMinutes
} = DateTimeUtil; 