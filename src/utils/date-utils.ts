export function formatDateToYYYYMMDD(date: Date | string): string {
	// Handle null, undefined, or empty values
	if (!date) {
		return new Date().toISOString().substring(0, 10);
	}
	
	if (typeof date === 'string') {
		const parsed = new Date(date);
		// Check if the parsed date is valid
		if (isNaN(parsed.getTime())) {
			return new Date().toISOString().substring(0, 10);
		}
		return parsed.toISOString().substring(0, 10);
	}
	
	// Check if the date object is valid
	if (isNaN(date.getTime())) {
		return new Date().toISOString().substring(0, 10);
	}
	
	return date.toISOString().substring(0, 10);
}
