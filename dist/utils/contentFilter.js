"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeMessageText = exports.maskPersonalDetails = exports.containsPersonalDetails = void 0;
const containsPersonalDetails = (text) => {
    if (!text || typeof text !== "string")
        return false;
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
        // /\b(?:booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld)\.(?:com|co\.uk)\b/gi,
        /\b(booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld|booking\.com|vrbo\.com|homeaway\.com|tripadvisor\.com|hotels\.com|kayak|skyscanner|orbitz|priceline|trivago|hostelworld\.com|makeymyhome)(?:\.(?:com|co\.uk|org|net))?\b/gi,
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
exports.containsPersonalDetails = containsPersonalDetails;
const maskPersonalDetails = (text) => {
    if (!text || typeof text !== "string")
        return text;
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
    // maskedText = maskedText.replace(/\b(booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld)\.(?:com|co\.uk|org|net)\b/gi, (match, site) => `${site.charAt(0)}*******.${match.split(".").pop()}`);
    maskedText = maskedText.replace(/\b(booking|airbnb|agoda|expedia|tripadvisor|hotels|vrbo|homeaway|hostelworld|booking\.com|vrbo\.com|homeaway\.com|tripadvisor\.com|hotels\.com|kayak|skyscanner|orbitz|priceline|trivago|hostelworld\.com|makeymyhome)(?:\.(?:com|co\.uk|org|net))?\b/gi, "[BLOCKED]");
    // ========== 7. PROCESS SOCIAL MEDIA ==========
    maskedText = maskedText.replace(/@([a-z0-9_])([a-z0-9_]*)/gi, (match, first, rest) => `@${first}*******`);
    maskedText = maskedText.replace(/\b(?:ig|insta|facebook|fb|twitter|linkedin|whatsapp|telegram)\s*[:.]?\s*@?[a-z0-9_.]+\b/gi, "[Social Media Removed]");
    // ========== 8. PROCESS CONTACT REQUESTS ==========
    maskedText = maskedText.replace(/\b(?:call|text|dm|pm|message|contact|reach|whatsapp|telegram|signal)\s+(?:me|us)\b/gi, "[Contact Request Removed]");
    return maskedText;
};
exports.maskPersonalDetails = maskPersonalDetails;
const sanitizeMessageText = (text) => {
    if (!text || typeof text !== "string") {
        return text;
    }
    if ((0, exports.containsPersonalDetails)(text)) {
        return (0, exports.maskPersonalDetails)(text);
    }
    return text;
};
exports.sanitizeMessageText = sanitizeMessageText;
