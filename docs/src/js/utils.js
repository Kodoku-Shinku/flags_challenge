// Utilities for normalizing and validating answers

/**
 * Remove accents/diacritics and convert to lowercase.
 * Returns an empty string for null/undefined.
 */
function removeAccents(str) {
    if (!str && str !== '') return '';
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                 .replace(/\u0301/g, '') // extra safety
                 .replace(/\u0300/g, '')
                 .toLowerCase();
}

/**
 * Normalize and clean an answer string for comparison.
 * Keeps letters a-z, spaces, hyphens and apostrophes.
 */
function normalizeAnswer(str) {
    if (!str && str !== '') return '';
    const cleaned = removeAccents(String(str).trim())
        .replace(/[^a-z\s\-']/g, '')
        .replace(/\s+/g, ' ');
    return cleaned;
}

export { removeAccents, normalizeAnswer };
