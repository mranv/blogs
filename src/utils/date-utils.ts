export function formatDateToYYYYMMDD(date: Date | string): string {
	// Handle null, undefined, or empty values
	if (!date) {
		return '';
	}

	let d: Date;
	if (typeof date === 'string') {
		d = new Date(date);
	} else {
		d = date;
	}

	// Check if the date object is valid
	if (isNaN(d.getTime())) {
		return '';
	}

	// Use local date components, NOT toISOString() (which uses UTC and shifts dates
	// for posts authored in timezones like IST). This ensures the displayed date
	// matches what the author wrote in frontmatter.
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}
