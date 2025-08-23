export function formatDateToYYYYMMDD(date: Date | string): string {
	if (typeof date === 'string') {
		return new Date(date).toISOString().substring(0, 10);
	}
	return date.toISOString().substring(0, 10);
}
