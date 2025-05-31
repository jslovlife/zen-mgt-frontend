/**
 * DateTimeUtil Usage Examples
 * This file demonstrates various ways to use the DateTimeUtil
 */

import { DateTimeUtil, DateInput } from './datetime.util';

// Sample dates for examples
const sampleDate: DateInput = '2024-03-15T14:30:45Z';
const sampleTimestamp: DateInput = 1710507045000; // Same date as timestamp
const sampleDateObject: DateInput = new Date('2024-03-15T14:30:45Z');

console.log('=== DateTimeUtil Examples ===\n');

// Basic validation
console.log('1. Date validation:');
console.log(`Valid date: ${DateTimeUtil.isValidDate(sampleDate)}`);
console.log(`Invalid date: ${DateTimeUtil.isValidDate('invalid-date')}\n`);

// Short formats
console.log('2. Short formats:');
console.log(`Short date: ${DateTimeUtil.toShortDate(sampleDate)}`); // 3/15/24
console.log(`Short datetime: ${DateTimeUtil.toShortDateTime(sampleDate)}\n`); // 3/15/24, 2:30:45 PM

// Medium formats (most commonly used)
console.log('3. Medium formats:');
console.log(`Medium date: ${DateTimeUtil.toMediumDate(sampleDate)}`); // Mar 15, 2024
console.log(`Medium datetime: ${DateTimeUtil.toMediumDateTime(sampleDate)}\n`); // Mar 15, 2024, 2:30:45 PM

// Long formats
console.log('4. Long formats:');
console.log(`Long date: ${DateTimeUtil.toLongDate(sampleDate)}`); // March 15, 2024
console.log(`Long datetime: ${DateTimeUtil.toLongDateTime(sampleDate)}\n`); // March 15, 2024, 2:30:45 PM

// Full formats
console.log('5. Full formats:');
console.log(`Full date: ${DateTimeUtil.toFullDate(sampleDate)}`); // Friday, March 15, 2024
console.log(`Full datetime: ${DateTimeUtil.toFullDateTime(sampleDate)}\n`); // Friday, March 15, 2024, 2:30:45 PM

// Time only
console.log('6. Time formats:');
console.log(`12-hour time: ${DateTimeUtil.toTime(sampleDate)}`); // 2:30 PM
console.log(`24-hour time: ${DateTimeUtil.toTime(sampleDate, { format: '24' })}`); // 14:30
console.log(`Time with seconds: ${DateTimeUtil.toTimeWithSeconds(sampleDate)}\n`); // 2:30:45 PM

// Custom formats
console.log('7. Custom formats:');
console.log(`Custom format: ${DateTimeUtil.toCustomFormat(sampleDate, 'YYYY-MM-DD HH:mm:ss')}`); // 2024-03-15 14:30:45
console.log(`Custom format: ${DateTimeUtil.toCustomFormat(sampleDate, 'DD/MM/YY')}`); // 15/03/24
console.log(`Custom format: ${DateTimeUtil.toCustomFormat(sampleDate, 'M/D/YYYY h:mm A')}\n`); // Custom patterns

// Relative time
console.log('8. Relative time:');
const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
console.log(`2 hours ago: ${DateTimeUtil.toRelativeTime(pastDate)}`);
console.log(`30 minutes from now: ${DateTimeUtil.toRelativeTime(futureDate)}\n`);

// ISO formats
console.log('9. ISO formats:');
console.log(`ISO string: ${DateTimeUtil.toISOString(sampleDate)}`); // 2024-03-15T14:30:45.000Z
console.log(`ISO date: ${DateTimeUtil.toISODate(sampleDate)}\n`); // 2024-03-15

// Application-specific formats
console.log('10. Application formats:');
console.log(`For table: ${DateTimeUtil.forTable(sampleDate)}`); // Mar 15, 2024
console.log(`For table with time: ${DateTimeUtil.forTableWithTime(sampleDate)}`); // Mar 15, 2024, 2:30:45 PM
console.log(`For date input: ${DateTimeUtil.forDateInput(sampleDate)}`); // 2024-03-15
console.log(`For datetime input: ${DateTimeUtil.forDateTimeInput(sampleDate)}`); // 2024-03-15T14:30
console.log(`For API: ${DateTimeUtil.forAPI(sampleDate)}`); // ISO string
console.log(`For display: ${DateTimeUtil.forDisplay(sampleDate)}\n`); // March 15, 2024

// Utility functions
console.log('11. Utility functions:');
console.log(`Start of day: ${DateTimeUtil.startOfDay(sampleDate)}`);
console.log(`End of day: ${DateTimeUtil.endOfDay(sampleDate)}`);
console.log(`Add 5 days: ${DateTimeUtil.addDays(sampleDate, 5)}`);
console.log(`Add 3 hours: ${DateTimeUtil.addHours(sampleDate, 3)}`);
console.log(`Add 30 minutes: ${DateTimeUtil.addMinutes(sampleDate, 30)}\n`);

// Different input types
console.log('12. Different input types:');
console.log(`From string: ${DateTimeUtil.toMediumDate('2024-03-15')}`);
console.log(`From timestamp: ${DateTimeUtil.toMediumDate(1710507045000)}`);
console.log(`From Date object: ${DateTimeUtil.toMediumDate(new Date())}\n`);

// Localization examples
console.log('13. Localization:');
console.log(`US format: ${DateTimeUtil.formatDate(sampleDate, { locale: 'en-US' })}`);
console.log(`UK format: ${DateTimeUtil.formatDate(sampleDate, { locale: 'en-GB' })}`);
console.log(`German format: ${DateTimeUtil.formatDate(sampleDate, { locale: 'de-DE' })}`);
console.log(`Japanese format: ${DateTimeUtil.formatDate(sampleDate, { locale: 'ja-JP' })}\n`);

export {
  sampleDate,
  sampleTimestamp,
  sampleDateObject
}; 