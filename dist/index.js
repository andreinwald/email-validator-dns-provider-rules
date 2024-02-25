"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMxDomains = exports.getLastInvalidText = exports.getLastInvalidReasonId = exports.isValidEmail = exports.INVALID_REASON_USERNAME_VENDOR_RULES = exports.INVALID_REASON_DOMAIN_IN_BLOCKLIST = exports.INVALID_REASON_NO_DNS_MX_RECORDS = exports.INVALID_REASON_DOMAIN_GENERAL_RULES = exports.INVALID_REASON_USERNAME_GENERAL_RULES = exports.INVALID_REASON_AMOUNT_OF_AT = void 0;
const mx_domains_cache_1 = require("./mx_domains_cache");
const USERNAME_MAIN_RULE = /^[a-z0-9._\-+]{1,64}$/;
const DOMAIN_RULE = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
const USERNAME_PROVIDER_RULES = {
    'google.com': /[_\-]/, // https://support.google.com/mail/answer/9211434?hl=en
    'yahoodns.net': /\+/, // https://login.yahoo.com/account/create
    // hotmail rules same as mainRule
};
const DNS_OVER_HTTPS_PROVIDERS = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
    'https://doh.sb/dns-query',
];
const BLOCKLIST_DOMAINS_EXAMPLE = [
    'hotnail.com', // too similar to hotmail
];
exports.INVALID_REASON_AMOUNT_OF_AT = 1;
exports.INVALID_REASON_USERNAME_GENERAL_RULES = 2;
exports.INVALID_REASON_DOMAIN_GENERAL_RULES = 3;
exports.INVALID_REASON_NO_DNS_MX_RECORDS = 4;
exports.INVALID_REASON_DOMAIN_IN_BLOCKLIST = 5;
exports.INVALID_REASON_USERNAME_VENDOR_RULES = 6;
const INVALID_REASON_TEXT = {
    [exports.INVALID_REASON_AMOUNT_OF_AT]: 'no @ symbol or too many of them',
    [exports.INVALID_REASON_USERNAME_GENERAL_RULES]: 'invalid username before @ by general email rules',
    [exports.INVALID_REASON_DOMAIN_GENERAL_RULES]: 'invalid domain after @ by general domain rules',
    [exports.INVALID_REASON_NO_DNS_MX_RECORDS]: 'domain after @ has no DNS MX records',
    [exports.INVALID_REASON_DOMAIN_IN_BLOCKLIST]: 'email domain is in blocklist',
    [exports.INVALID_REASON_USERNAME_VENDOR_RULES]: 'invalid username before @ by domain vendor rules',
};
let lastReasonId;
async function isValidEmail(email, blocklistDomains = null, dohProvider = null) {
    lastReasonId = false;
    email = String(email).toLowerCase();
    let parts = email.split('@');
    if (!parts || parts.length !== 2) {
        lastReasonId = exports.INVALID_REASON_AMOUNT_OF_AT;
        return false;
    }
    let [username, domain] = parts;
    if (USERNAME_MAIN_RULE.test(username) === false) {
        lastReasonId = exports.INVALID_REASON_USERNAME_GENERAL_RULES;
        return false;
    }
    if (DOMAIN_RULE.test(domain) === false) {
        lastReasonId = exports.INVALID_REASON_DOMAIN_GENERAL_RULES;
        return false;
    }
    let mxDomains = await getMxDomains(domain, dohProvider);
    if (mxDomains === false || !Array.isArray(mxDomains)) {
        // problem with mx request - better pass next
        return true;
    }
    if (!mxDomains.length) {
        lastReasonId = exports.INVALID_REASON_NO_DNS_MX_RECORDS;
        return false;
    }
    for (let mxDomain of mxDomains) {
        if (BLOCKLIST_DOMAINS_EXAMPLE.includes(mxDomain) || BLOCKLIST_DOMAINS_EXAMPLE.includes(domain)) {
            lastReasonId = exports.INVALID_REASON_DOMAIN_IN_BLOCKLIST;
            return false;
        }
        if (blocklistDomains !== null && (blocklistDomains.includes(mxDomain) || blocklistDomains.includes(domain))) {
            lastReasonId = exports.INVALID_REASON_DOMAIN_IN_BLOCKLIST;
            return false;
        }
        if (!checkProviderRules(username, domain, mxDomain)) {
            lastReasonId = exports.INVALID_REASON_USERNAME_VENDOR_RULES;
            return false;
        }
    }
    return true;
}
exports.isValidEmail = isValidEmail;
function getLastInvalidReasonId() {
    return lastReasonId;
}
exports.getLastInvalidReasonId = getLastInvalidReasonId;
function getLastInvalidText() {
    if (lastReasonId === false || typeof lastReasonId !== "number") {
        return false;
    }
    return INVALID_REASON_TEXT[lastReasonId];
}
exports.getLastInvalidText = getLastInvalidText;
function checkProviderRules(username, domain, mxDomain) {
    if (mxDomain === 'google.com' && domain !== 'gmail.com') {
        mxDomain = 'google_workplace';
    }
    if (domain === 'gmail.com' && username.includes('+')) {
        username = username.substring(0, username.indexOf('+'));
    }
    if (USERNAME_PROVIDER_RULES[mxDomain]) {
        return USERNAME_PROVIDER_RULES[mxDomain].test(username) === false;
    }
    return true;
}
async function getMxDomains(emailDomain, dohProvider = null) {
    if (mx_domains_cache_1.default[emailDomain]) {
        return new Promise((resolve) => {
            resolve([mx_domains_cache_1.default[emailDomain]]);
        });
    }
    let response = await getMxRecords(emailDomain, dohProvider);
    if (!response || !response.ok) {
        console.log('problem with mx request ' + emailDomain);
        return false;
    }
    let data = await response.json();
    if (!data || !('Status' in data)) {
        console.log('problem with mx request ' + emailDomain, data);
        return false;
    }
    if (!data['Answer'] || !data['Answer'].length) {
        return [];
    }
    let result = [];
    data['Answer'].map(row => {
        let mxDomain = row.data.substring(row.data.indexOf(' ') + 1).trim().toLowerCase();
        mxDomain = mxDomain.replace(/\.*$/, '');
        let parts = mxDomain.split('.');
        if (parts.length < 3) {
            result.push(mxDomain);
        }
        else {
            result.push(parts.slice(parts.length - 2).join('.'));
            result.push(parts.slice(parts.length - 3).join('.'));
        }
    });
    let unique = result.filter((value, index, array) => array.indexOf(value) === index);
    return unique;
}
exports.getMxDomains = getMxDomains;
async function getMxRecords(emailDomain, dohProvider = null, retry = 3) {
    let iteration = 0;
    let excludeResolvers = [];
    if (dohProvider !== null && dohProvider.length > 3) {
        return fetch(dohProvider + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: { accept: 'application/dns-json' }
        });
    }
    async function request() {
        let notTriedDomains = DNS_OVER_HTTPS_PROVIDERS.filter(x => !excludeResolvers.includes(x));
        let resolver = notTriedDomains[(Math.floor(Math.random() * notTriedDomains.length))];
        excludeResolvers.push(resolver);
        let response = await fetch(resolver + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: { accept: 'application/dns-json' }
        });
        if (!response.ok) {
            iteration++;
            if (iteration < retry) {
                return request();
            }
            else
                return false;
        }
        return response;
    }
    return await request();
}
