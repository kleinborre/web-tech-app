/**
 * ImageToTextOnline - Email Domain Validator
 * 
 * Uses DNS MX record lookups to verify that an email address
 * belongs to a domain that can actually receive emails.
 * Uses Node.js built-in `dns` module — no external API keys needed.
 * 
 * @version 1.0.0
 */

import dns from 'dns';

/**
 * Validate that an email domain has valid MX (mail exchange) records.
 * 
 * @param {string} email - The email address to validate
 * @returns {Promise<boolean>} True if the domain has MX records, false otherwise
 * 
 * @example
 *   await validateEmailDomain('user@gmail.com');    // true  (gmail.com has MX records)
 *   await validateEmailDomain('user@zyx.com');      // false (zyx.com has no MX records)
 *   await validateEmailDomain('user@fakefake.xyz'); // false (domain doesn't exist)
 */
export const validateEmailDomain = async (email) => {
    try {
        const domain = email.split('@')[1];
        if (!domain) return false;

        // Resolve MX records for the domain
        const records = await dns.promises.resolveMx(domain);
        return Array.isArray(records) && records.length > 0;
    } catch (error) {
        // ENOTFOUND = domain doesn't exist
        // ENODATA  = domain exists but no MX records
        // ETIMEOUT = DNS timeout (fail open — don't block user)
        if (error.code === 'ETIMEOUT' || error.code === 'ECONNREFUSED') {
            // DNS server unreachable — fail open (allow the email)
            console.warn(`[EmailValidator] DNS lookup timeout for: ${email}`);
            return true;
        }
        return false;
    }
};
