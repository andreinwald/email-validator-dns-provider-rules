import mx_domains_cache from "./mx_domains_cache"
import {promises as dnsPromises} from "dns";

const USERNAME_MAIN_RULE = /^[a-z0-9._\-+]{1,64}$/
const DOMAIN_RULE = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/
const USERNAME_PROVIDER_RULES = {
    'google.com': /[_\-]/, // https://support.google.com/mail/answer/9211434?hl=en
    'yahoodns.net': /\+/, // https://login.yahoo.com/account/create
    // hotmail rules same as mainRule
}
const DNS_OVER_HTTPS_PROVIDERS = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
    'https://doh.sb/dns-query',
];
const BLOCKLIST_DOMAINS_EXAMPLE = [
    'hotnail.com', // too similar to hotmail
]
export const INVALID_REASON_AMOUNT_OF_AT = 1;
export const INVALID_REASON_USERNAME_GENERAL_RULES = 2;
export const INVALID_REASON_DOMAIN_GENERAL_RULES = 3;
export const INVALID_REASON_NO_DNS_MX_RECORDS = 4;
export const INVALID_REASON_DOMAIN_IN_BLOCKLIST = 5;
export const INVALID_REASON_USERNAME_VENDOR_RULES = 6;

const INVALID_REASON_TEXT = {
    [INVALID_REASON_AMOUNT_OF_AT]: 'no @ symbol or too many of them',
    [INVALID_REASON_USERNAME_GENERAL_RULES]: 'invalid username before @ by general email rules',
    [INVALID_REASON_DOMAIN_GENERAL_RULES]: 'invalid domain after @ by general domain rules',
    [INVALID_REASON_NO_DNS_MX_RECORDS]: 'domain after @ has no DNS MX records',
    [INVALID_REASON_DOMAIN_IN_BLOCKLIST]: 'email domain is in blocklist',
    [INVALID_REASON_USERNAME_VENDOR_RULES]: 'invalid username before @ by domain vendor rules',
}
let lastReasonId: boolean | number;


export async function isValidEmail(email, blocklistDomains = null, dohProvider = null) {
    lastReasonId = false;
    email = String(email).toLowerCase();
    let parts = email.split('@');
    if (!parts || parts.length !== 2) {
        lastReasonId = INVALID_REASON_AMOUNT_OF_AT;
        return false;
    }
    let [username, domain] = parts;
    if (USERNAME_MAIN_RULE.test(username) === false) {
        lastReasonId = INVALID_REASON_USERNAME_GENERAL_RULES;
        return false;
    }
    if (DOMAIN_RULE.test(domain) === false) {
        lastReasonId = INVALID_REASON_DOMAIN_GENERAL_RULES;
        return false;
    }
    let mxDomains = await getMxDomains(domain, dohProvider);
    if (mxDomains === false) {
        // problem with mx request - better pass next
        return true;
    }
    if (!mxDomains.length) {
        lastReasonId = INVALID_REASON_NO_DNS_MX_RECORDS;
        return false;
    }
    for (let mxDomain of mxDomains) {
        if (BLOCKLIST_DOMAINS_EXAMPLE.includes(mxDomain) || BLOCKLIST_DOMAINS_EXAMPLE.includes(domain)) {
            lastReasonId = INVALID_REASON_DOMAIN_IN_BLOCKLIST;
            return false;
        }
        if (blocklistDomains !== null && (blocklistDomains.includes(mxDomain) || blocklistDomains.includes(domain))) {
            lastReasonId = INVALID_REASON_DOMAIN_IN_BLOCKLIST;
            return false;
        }
        if (!checkProviderRules(username, domain, mxDomain)) {
            lastReasonId = INVALID_REASON_USERNAME_VENDOR_RULES;
            return false;
        }
    }
    return true;
}

export function getLastInvalidReasonId(): number | boolean {
    return lastReasonId;
}

export function getLastInvalidText(): string | boolean {
    if (lastReasonId === false || typeof lastReasonId !== "number") {
        return false;
    }
    return INVALID_REASON_TEXT[lastReasonId];
}

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

export async function getMxDomains(emailDomain, ownDohProviderHost = null): Promise<string[] | false> {
    if (mx_domains_cache[emailDomain]) {
        return [mx_domains_cache[emailDomain]];
    }
    let records = await getMxRecords(emailDomain, ownDohProviderHost);
    if (records === false) {
        return false;
    }
    let result = [];
    records.map(record => {
        let parts = record.split('.');
        if (parts.length < 3) {
            result.push(record);
        } else {
            result.push(parts.slice(parts.length - 2).join('.'));
            result.push(parts.slice(parts.length - 3).join('.'));
        }
    });
    let unique = result.filter((value, index, array) => array.indexOf(value) === index);
    return unique;
}

async function getMxRecords(emailDomain: string, ownDohProviderHost = null, retry = 3): Promise<string[] | false> {
    async function processDohResponse(response: Response) {
        let data = await response.json();
        if (!data || !('Status' in data)) {
            console.error('problem with mx request ' + emailDomain, data);
            return false;
        }
        if (!data['Answer'] || !data['Answer'].length) {
            return [];
        }
        return data['Answer'].map(row => {
            let mxDomain = row.data.substring(row.data.indexOf(' ') + 1).trim().toLowerCase();
            return mxDomain.replace(/\.*$/, ''); // last dot
        });
    }


    // ---------- Own DOH provider
    if (ownDohProviderHost !== null && ownDohProviderHost.length > 3) {
        let response = await fetch(ownDohProviderHost + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: {accept: 'application/dns-json'}
        });
        return processDohResponse(response);
    }

    // ---------- Node.js
    if (typeof process !== 'undefined') {
        let dnsPromises = require('dns').promises;
        try {
            let records = await dnsPromises.resolveMx(emailDomain);
            return records.map(rec => rec.exchange);
        } catch (error) {
            console.error('problem with mx request ' + emailDomain, error.message);
            if (error.message.includes('ENOTFOUND')) {
                return [];
            }
            return false;
        }
    }

    // ---------- Default DOH providers
    let iteration = 0;
    let excludeResolvers = [];

    async function iterateDefaultProviders() {
        let notTriedProviders = DNS_OVER_HTTPS_PROVIDERS.filter(x => !excludeResolvers.includes(x));
        let resolver = notTriedProviders[(Math.floor(Math.random() * notTriedProviders.length))];
        excludeResolvers.push(resolver);
        let response = await fetch(resolver + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: {accept: 'application/dns-json'}
        });
        if (!response.ok) {
            iteration++;
            if (iteration < retry) {
                return iterateDefaultProviders();
            } else {
                console.error('Out of iterations for mx request ' + emailDomain);
                return false;
            }
        }
        return processDohResponse(response);
    }

    return iterateDefaultProviders();
}
