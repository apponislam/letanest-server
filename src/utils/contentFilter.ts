// export const containsPersonalDetails = (text: string): boolean => {
//     const patterns = [
//         // URLs
//         /https?:\/\/[^\s]+/gi,
//         /www\.[^\s]+/gi,
//         /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi,

//         // Email addresses
//         /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

//         // Phone numbers (international format)
//         /\b\+?[\d\s-()]{10,}\b/gi,

//         // Common booking domains
//         /booking\.com/gi,
//         /airbnb\.com/gi,
//         /agoda\.com/gi,
//         /expedia\.com/gi,
//         /tripadvisor\.com/gi,
//         /hotels\.com/gi,
//     ];

//     return patterns.some((pattern) => pattern.test(text));
// };

// export const sanitizeMessageText = (text: string): string => {
//     if (containsPersonalDetails(text)) {
//         return "You can't share personal details or external links";
//     }
//     return text;
// };

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
    // Mask phone numbers: 01722779803 → 01********3
    text = text.replace(/\b(\d{2})\d+(\d{1})\b/gi, "$1********$2");

    // Mask emails: 11appon11@gmail.com → 1********@gmail.com
    text = text.replace(/\b([a-zA-Z0-9]{1})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi, "$1********@$2");

    // Mask domains: booking.com → b*******.com
    text = text.replace(/\b([a-zA-Z]{1})[a-zA-Z0-9-]*\.([a-zA-Z]{2,})\b/gi, "$1*******.$2");

    return text;
};

export const sanitizeMessageText = (text: string): string => {
    if (containsPersonalDetails(text)) {
        return maskPersonalDetails(text);
    }
    return text;
};
