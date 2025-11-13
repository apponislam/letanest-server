export const containsPersonalDetails = (text: string): boolean => {
    const patterns = [
        // URLs
        /https?:\/\/[^\s]+/gi,
        /www\.[^\s]+/gi,
        /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi,

        // Email addresses
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

        // Phone numbers (international format)
        /\b\+?[\d\s-()]{10,}\b/gi,

        // Common booking domains
        /booking\.com/gi,
        /airbnb\.com/gi,
        /agoda\.com/gi,
        /expedia\.com/gi,
        /tripadvisor\.com/gi,
        /hotels\.com/gi,
    ];

    return patterns.some((pattern) => pattern.test(text));
};

export const maskPersonalDetails = (text: string): string => {
    let maskedText = text;

    // Mask full URLs first
    maskedText = maskedText.replace(/https?:\/\/[^\s]+/gi, "[Link Removed]");
    maskedText = maskedText.replace(/www\.[^\s]+/gi, "[Link Removed]");

    // Mask phone numbers: 01722779803 → 01********3
    maskedText = maskedText.replace(/\b(\d{2})\d+(\d{1})\b/gi, "$1********$2");

    // Mask emails: 11appon11@gmail.com → 1********@gmail.com
    maskedText = maskedText.replace(/\b([a-zA-Z0-9]{1})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi, "$1********@$2");

    // Mask domains: booking.com → b*******.com
    maskedText = maskedText.replace(/\b([a-zA-Z]{1})[a-zA-Z0-9-]*\.([a-zA-Z]{2,})\b/gi, "$1*******.$2");

    return maskedText;
};

export const sanitizeMessageText = (text: string): string => {
    if (containsPersonalDetails(text)) {
        return maskPersonalDetails(text);
    }
    return text;
};
