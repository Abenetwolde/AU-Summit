import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string using DOMPurify.
 * By default, it allows a safe set of formatting tags.
 */
export const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'hr',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'img', 'table',
            'thead', 'tbody', 'tr', 'th', 'td'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'target']
    });
};

/**
 * Sanitizes a string and returns plain text only.
 */
/**
 * Sanitizes a string and returns plain text only.
 */
export const stripHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    });
};

/**
 * Detects potential XSS patterns in a string.
 */
export const detectXSS = (html: string): boolean => {
    if (!html) return false;
    const suspiciousPatterns = [
        /<script/i,
        /on\w+=/i,
        /javascript:/i,
        /expression\(/i,
        /vbscript:/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(html));
};
