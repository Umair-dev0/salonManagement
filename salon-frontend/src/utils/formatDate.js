/**
 * Formats a UTC date string into a clean, readable Indian date format.
 * E.g., "2026-07-04" -> 4 Jul 2026
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
};
