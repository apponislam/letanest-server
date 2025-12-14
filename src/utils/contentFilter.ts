// export const containsPersonalDetails = (text: string): boolean => {
//     if (!text || typeof text !== "string") return false;

//     const patterns = [
//         // ========== URL PATTERNS ==========
//         // Complete URL patterns
//         /(?:https?:\/\/|www\.)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}(?:\/[^\s]*)?/gi,
//         // Domain patterns (common TLDs)
//         /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|co\.uk|org|net|io|info|app|uk|biz|me|tv|gov|edu|ac\.uk)\b/gi,

//         // ========== EMAIL PATTERNS ==========
//         // Standard email
//         /\b[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
//         // Obfuscated email patterns
//         /\b[a-z0-9._%+-]+(?:\s*(?:\(at\)|\[at\]|at|@)\s*)[a-z0-9.-]+(?:\s*(?:\(dot\)|\[dot\]|dot|\.)\s*)[a-z]{2,}\b/gi,
//         // Spaced email characters
//         /(?:(?:[a-z0-9]\s*)+@(?:[a-z0-9]\s*)+(?:\s*\.\s*[a-z]\s*){2,})/gi,

//         // ========== PHONE NUMBER PATTERNS ==========
//         // UK phone formats (most common)
//         /\b(?:(?:\+44|0044|0)\s*[1-9]\d{1,4}\s*\d{3,4}\s*\d{3,4})\b/gi,
//         /\b07\d{2}\s*\d{3}\s*\d{3}\b/gi,
//         // International phone
//         /\b\+\d{1,3}[\s.-]*\d{6,14}\b/gi,
//         // Digit sequences (potential phones)
//         /\b\d{10,15}\b/gi,
//         // Spaced digits (common bypass)
//         /\b(?:\d\s*){10,}\b/gi,
//         // Spelled numbers (basic detection)
//         /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine)){7,}\b/gi,

//         // ========== SPECIFIC DOMAINS ==========
//         /\b(?:booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld|kayak|skyscanner)\.(?:com|co\.uk|org|net)\b/gi,

//         // ========== SOCIAL & CONTACT PATTERNS ==========
//         // Social handles
//         /@[a-z0-9_.]{2,30}(?:\b|$)/gi,
//         // Contact platform references
//         /\b(?:whatsapp|telegram|signal|wechat|skype|zoom|messenger|viber)\s*(?:me|us|id|number)?\b/gi,
//         // Contact request patterns
//         /\b(?:call|text|dm|pm|message|contact)\s+(?:me|us)\s+(?:on|at|via|through)\b/gi,

//         // ========== BYPASS PATTERNS ==========
//         // Character substitution patterns
//         /\b[a-z]\s+[a-z]\s+[a-z]\s*(?:at|@)\s*[a-z]/gi,
//         /\b\d\s+\d\s+\d\s+\d\s+\d/gi,
//         // Code words for contact
//         /\b(?:remove|delete|take)\s+(?:spaces|dots|parentheses)\b/gi,
//     ];

//     for (const pattern of patterns) {
//         if (pattern.test(text)) {
//             pattern.lastIndex = 0;
//             return true;
//         }
//         pattern.lastIndex = 0;
//     }

//     return false;
// };

// export const maskPersonalDetails = (text: string): string => {
//     if (!text || typeof text !== "string") return text;

//     let maskedText = text;

//     // ========== PROCESSING ORDER ==========
//     // 1. First process the most specific patterns
//     // 2. Then process general patterns

//     // === 1. URL masking ===
//     // Full URLs
//     maskedText = maskedText.replace(/(?:https?:\/\/|www\.)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}(?:\/[^\s]*)?/gi, (match) => {
//         const clean = match.replace(/^(?:https?:\/\/|www\.)/, "");
//         const firstChar = clean.charAt(0);
//         return `${firstChar}*******[Link]`;
//     });

//     // Domain names
//     maskedText = maskedText.replace(/\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|co\.uk|org|net|io|info|app|uk|biz|me|tv|gov|edu|ac\.uk)\b/gi, (match) => {
//         const parts = match.split(".");
//         if (parts.length > 1) {
//             const domain = parts[0];
//             return `${domain.charAt(0)}*******.${parts.slice(1).join(".")}`;
//         }
//         return "[Domain Removed]";
//     });

//     // === 2. Email masking ===
//     // Standard emails
//     maskedText = maskedText.replace(/\b([a-z0-9])[a-z0-9._%+-]*@([a-z0-9.-]+\.[a-z]{2,})\b/gi, "$1********@$2");

//     // Obfuscated emails
//     maskedText = maskedText.replace(/\b([a-z0-9._%+-]+)(?:\s*(?:\(at\)|\[at\]|at|@)\s*)([a-z0-9.-]+)(?:\s*(?:\(dot\)|\[dot\]|dot|\.)\s*)([a-z]{2,})\b/gi, (match, user, domain, ext) => {
//         const cleanUser = user.replace(/\s+/g, "");
//         return `${cleanUser.charAt(0)}********@${domain}.${ext}`;
//     });

//     // === 3. Phone number masking ===
//     // UK numbers with various formats
//     maskedText = maskedText.replace(/\b(?:(?:\+44|0044|0)\s*)([1-9]\d{1,4})\s*\d{3,4}\s*\d{3,4}\b/gi, (match, prefix) => `${prefix}********`);

//     maskedText = maskedText.replace(/\b(07\d{2})\s*\d{3}\s*\d{3}\b/gi, (match, prefix) => `${prefix}*******`);

//     // International numbers
//     maskedText = maskedText.replace(/\b(\+\d{1,3}[\s.-]*\d{2})\d{4,12}\b/gi, (match, prefix) => `${prefix}********`);

//     // Digit sequences
//     maskedText = maskedText.replace(/\b(\d{2})\d{8,13}\b/gi, (match, prefix) => `${prefix}********`);

//     // Spaced digits
//     maskedText = maskedText.replace(/\b((?:\d\s*){2})(?:\d\s*){7,}\d\b/gi, (match, prefix) => {
//         const cleanPrefix = prefix.replace(/\s+/g, "");
//         return `${cleanPrefix}********`;
//     });

//     // === 4. Specific domains ===
//     maskedText = maskedText.replace(/\b(booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld|kayak|skyscanner)\.(?:com|co\.uk|org|net)\b/gi, (match, site) => `${site.charAt(0)}*******.${match.split(".").pop()}`);

//     // === 5. Social handles ===
//     maskedText = maskedText.replace(/@([a-z0-9_.]{2,30})(?:\b|$)/gi, (match, handle) => `@${handle.charAt(0)}*******`);

//     // === 6. Contact platform references ===
//     maskedText = maskedText.replace(/\b(whatsapp|telegram|signal|wechat|skype|zoom|messenger|viber)\s*(?:me|us|id|number)?\b/gi, (match, platform) => `[${platform.charAt(0).toUpperCase()}******* App]`);

//     // === 7. Contact requests ===
//     maskedText = maskedText.replace(/\b(call|text|dm|pm|message|contact)\s+(?:me|us)\s+(?:on|at|via|through)\b/gi, "[Contact Request]");

//     return maskedText;
// };

// export const sanitizeMessageText = (text: string): string => {
//     if (!text || typeof text !== "string") {
//         return text;
//     }

//     const hasPII = containsPersonalDetails(text);
//     if (!hasPII) {
//         return text;
//     }

//     const masked = maskPersonalDetails(text);

//     // Additional check: if masking removed too much or didn't work properly
//     if (masked === text && hasPII) {
//         // Fallback: replace entire message if masking failed
//         return "[Message contains contact information]";
//     }

//     return masked;
// };

// // Optional: Add a function to get detection details
// export const getDetectionDetails = (
//     text: string
// ): {
//     hasPII: boolean;
//     detectedTypes: string[];
//     sampleMatches: string[];
// } => {
//     if (!text || typeof text !== "string") {
//         return { hasPII: false, detectedTypes: [], sampleMatches: [] };
//     }

//     const patterns = {
//         urls: /(?:https?:\/\/|www\.)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}(?:\/[^\s]*)?/gi,
//         domains: /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|co\.uk|org|net|io|info|app|uk|biz|me|tv|gov|edu|ac\.uk)\b/gi,
//         emails: /\b[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
//         phones: /\b(?:(?:\+44|0044|0)\s*[1-9]\d{1,4}\s*\d{3,4}\s*\d{3,4}|07\d{2}\s*\d{3}\s*\d{3}|\+\d{1,3}[\s.-]*\d{6,14})\b/gi,
//         social: /@[a-z0-9_.]{2,30}(?:\b|$)/gi,
//         contactRequests: /\b(?:call|text|dm|pm|message|contact)\s+(?:me|us)\s+(?:on|at|via|through)\b/gi,
//     };

//     const detectedTypes: string[] = [];
//     const sampleMatches: string[] = [];

//     for (const [type, pattern] of Object.entries(patterns)) {
//         const matches = text.match(pattern);
//         pattern.lastIndex = 0;

//         if (matches && matches.length > 0) {
//             detectedTypes.push(type);
//             sampleMatches.push(...matches.slice(0, 2)); // Take first 2 matches
//         }
//     }

//     return {
//         hasPII: detectedTypes.length > 0,
//         detectedTypes,
//         sampleMatches: Array.from(new Set(sampleMatches)).slice(0, 5), // Unique matches, max 5
//     };
// };

export const containsPersonalDetails = (text: string): boolean => {
    if (!text || typeof text !== "string") return false;

    const patterns = [
        // ========== URL PATTERNS ==========
        /https?:\/\/(?:www\.)?[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\.[a-z]{2,}(?:\/[^\s]*)?/gi,
        /www\.[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\.[a-z]{2,}(?:\/[^\s]*)?/gi,
        /\b[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\.(?:com|co\.uk|org|net|io|info|app|uk|biz|me|tv)\b/gi,

        // ========== EMAIL PATTERNS ==========
        /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
        /\b[a-z0-9._%+-]+\s*(?:\(at\)|at|@)\s*[a-z0-9.-]+\s*(?:\(dot\)|dot|\.)\s*[a-z]{2,}\b/gi,
        /(?:[a-z0-9]\s*)+@(?:[a-z0-9]\s*)+(?:\s*\.\s*[a-z]\s*){2,}/gi,

        // ========== PHONE NUMBER PATTERNS ==========
        // Standard UK numbers
        /\b07\d{9}\b/gi,
        /\b(?:\+44|0044|0)[1-9]\d{8,9}\b/gi,
        /\b\d{10,12}\b/gi,

        // Spaced numbers (all formats)
        /\b(?:\d\s*){10,}\b/gi,
        /\b(?:\d[\s.-]){9,}\d\b/gi,

        // Spelled-out numbers - FIXED TO CATCH "zero one seven two..."
        /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine)){9,}\b/gi,

        // Combined spelled and digits
        /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|\d)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine|\d)){9,}\b/gi,

        // ========== DOMAIN PATTERNS ==========
        /\b(?:booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld)\.(?:com|co\.uk)\b/gi,

        // ========== SOCIAL MEDIA ==========
        /@[a-z0-9_]{2,50}(?=\b|$)/gi,
        /\b(?:ig|insta|facebook|fb|twitter|linkedin|whatsapp|telegram)\s*[:.]?\s*@?[a-z0-9_.]+\b/gi,

        // ========== CONTACT REQUESTS ==========
        /\b(?:call|text|dm|pm|message|contact|reach|whatsapp|telegram|signal)\s+(?:me|us)\b/gi,
    ];

    for (const pattern of patterns) {
        if (pattern.test(text)) {
            pattern.lastIndex = 0;
            return true;
        }
        pattern.lastIndex = 0;
    }

    return false;
};

export const maskPersonalDetails = (text: string): string => {
    if (!text || typeof text !== "string") return text;

    let maskedText = text;

    // Store original to avoid double processing
    const originalText = maskedText;

    // ========== 1. PROCESS SPELLED-OUT NUMBERS FIRST ==========
    // This catches "zero one seven two two seven seven nine eight zero three"
    maskedText = maskedText.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(zero|one|two|three|four|five|six|seven|eight|nine)){9,}\b/gi, "[Phone Removed]");

    // ========== 2. PROCESS SPACED NUMBERS ==========
    maskedText = maskedText.replace(/\b(?:\d\s*){10,}\b/gi, "[Phone Removed]");
    maskedText = maskedText.replace(/\b(?:\d[\s.-]){9,}\d\b/gi, "[Phone Removed]");

    // ========== 3. PROCESS STANDARD NUMBERS ==========
    maskedText = maskedText.replace(/\b(07\d{2})\d{7}\b/gi, "$1*******");
    maskedText = maskedText.replace(/\b((?:\+44|0044|0)[1-9]\d{1,2})\d{6,7}\b/gi, "$1********");
    maskedText = maskedText.replace(/\b(\d{2,4})\d{6,8}\b/gi, (match, prefix) => (prefix.length >= 2 && prefix.length <= 4 ? `${prefix}********` : match));

    // ========== 4. PROCESS EMAILS ==========
    maskedText = maskedText.replace(/\b([a-z0-9._%+-])[a-z0-9._%+-]*@([a-z0-9.-]+\.[a-z]{2,})\b/gi, "$1********@$2");

    maskedText = maskedText.replace(/\b([a-z0-9._%+-]+)\s*(?:\(at\)|at|@)\s*([a-z0-9.-]+)\s*(?:\(dot\)|dot|\.)\s*([a-z]{2,})\b/gi, (match, user, domain, ext) => `${user.charAt(0)}********@${domain}.${ext}`);

    maskedText = maskedText.replace(/(?:[a-z0-9]\s*)+@(?:[a-z0-9]\s*)+(?:\s*\.\s*[a-z]\s*){2,}/gi, (match) => {
        const clean = match.replace(/\s+/g, "");
        const [local, domain] = clean.split("@");
        return `${local.charAt(0)}********@${domain}`;
    });

    // ========== 5. PROCESS URLs ==========
    maskedText = maskedText.replace(/https?:\/\/(?:www\.)?([a-z0-9][a-z0-9-]*)\.[a-z]{2,}(?:\/[^\s]*)?/gi, (match, domain) => `${domain.charAt(0)}*******[Link]`);

    maskedText = maskedText.replace(/www\.([a-z0-9][a-z0-9-]*)\.[a-z]{2,}(?:\/[^\s]*)?/gi, (match, domain) => `${domain.charAt(0)}*******[Link]`);

    maskedText = maskedText.replace(/\b([a-z0-9][a-z0-9-]*)\.(?:com|co\.uk|org|net|io|info|app|uk|biz|me|tv)\b/gi, (match, domain) => `${domain.charAt(0)}*******.${match.split(".").pop()}`);

    // ========== 6. PROCESS BOOKING DOMAINS ==========
    maskedText = maskedText.replace(/\b(booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld)\.(?:com|co\.uk)\b/gi, (match, site) => `${site.charAt(0)}*******.${match.split(".").pop()}`);

    // ========== 7. PROCESS SOCIAL MEDIA ==========
    maskedText = maskedText.replace(/@([a-z0-9_])([a-z0-9_]*)/gi, (match, first, rest) => `@${first}*******`);

    maskedText = maskedText.replace(/\b(?:ig|insta|facebook|fb|twitter|linkedin|whatsapp|telegram)\s*[:.]?\s*@?[a-z0-9_.]+\b/gi, "[Social Media Removed]");

    // ========== 8. PROCESS CONTACT REQUESTS ==========
    maskedText = maskedText.replace(/\b(?:call|text|dm|pm|message|contact|reach|whatsapp|telegram|signal)\s+(?:me|us)\b/gi, "[Contact Request Removed]");

    return maskedText;
};

export const sanitizeMessageText = (text: string): string => {
    if (!text || typeof text !== "string") {
        return text;
    }

    if (containsPersonalDetails(text)) {
        return maskPersonalDetails(text);
    }

    return text;
};

// TEST FUNCTION TO VERIFY IT WORKS
export const testAllPatterns = () => {
    const testCases = [
        // Spelled-out numbers (the one you mentioned)
        "zero one seven two two seven seven nine eight zero three",

        // Other spelled variations
        "zero seven eight one two three four five six seven eight",
        "zero four two zero seven seven nine eight zero one two",

        // Mixed formats
        "call me at zero seven eight one two three four five six seven",
        "my number is zero 7 eight 1 two 3 four 5 six 7 eight",

        // Standard numbers
        "07812345678",
        "+441234567890",
        "02081234567",

        // Spaced numbers
        "0 7 8 1 2 3 4 5 6 7 8",
        "07 81 23 45 67",
        "020 8123 4567",

        // Emails
        "john@gmail.com",
        "john(at)gmail(dot)com",
        "j o h n @ g m a i l . c o m",

        // URLs
        "https://booking.com",
        "www.airbnb.com",
        "booking.com",

        // Social
        "@username",
        "dm me on instagram @user123",

        // Contact requests
        "call me on whatsapp",
        "text me via telegram",

        // Complex messages
        "Hi, my number is zero one seven two two seven seven nine eight zero three and email is john@gmail.com",
        "Visit booking.com or call 07812345678",
    ];

    console.log("=== TESTING ALL CONTACT PATTERNS ===\n");

    testCases.forEach((test, i) => {
        console.log(`Test ${i + 1}:`);
        console.log(`Original:  "${test}"`);
        console.log(`Has PII:   ${containsPersonalDetails(test)}`);
        console.log(`Sanitized: "${sanitizeMessageText(test)}"`);
        console.log("---");
    });

    return "Testing complete";
};
