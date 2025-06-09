import mx_domains_cache from "./mx_domains_cache"

const USERNAME_MAIN_RULE = /^[a-z0-9._\-+]{1,64}$/
const DOMAIN_RULE = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/
const USERNAME_PROVIDER_RULES = {
    'google.com': /[_\-]/, // https://support.google.com/mail/answer/9211434?hl=en
    'yahoodns.net': /\+/, // https://login.yahoo.com/account/create
    // hotmail rules same as mainRule
}
export const DNS_OVER_HTTPS_PROVIDERS = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
    'https://doh.sb/dns-query',
];
const BLOCKLIST_DOMAINS_EXAMPLE = [
    'hotnail.com', // too similar to hotmail
]
const POPULAR_DOMAIN_TYPOS = [
    'gamil.com',
    'gmil.com',
    'gmail.co',
    'gnail.com',
    'gmeil.com',
    'gmai.com',
    'gmal.com',
];

export const INVALID_REASON_AMOUNT_OF_AT = 1;
export const INVALID_REASON_USERNAME_GENERAL_RULES = 2;
export const INVALID_REASON_DOMAIN_GENERAL_RULES = 3;
export const INVALID_REASON_NO_DNS_MX_RECORDS = 4;
export const INVALID_REASON_DOMAIN_IN_BLOCKLIST = 5;
export const INVALID_REASON_USERNAME_VENDOR_RULES = 6;
export const INVALID_REASON_DOMAIN_POPULAR_TYPO = 7;

const INVALID_REASON_TEXT = {
    [INVALID_REASON_AMOUNT_OF_AT]: 'no @ symbol or too many of them',
    [INVALID_REASON_USERNAME_GENERAL_RULES]: 'invalid username before @ by general email rules',
    [INVALID_REASON_DOMAIN_GENERAL_RULES]: 'invalid domain after @ by general domain rules',
    [INVALID_REASON_NO_DNS_MX_RECORDS]: 'domain after @ has no DNS MX records',
    [INVALID_REASON_DOMAIN_IN_BLOCKLIST]: 'email domain is in blocklist',
    [INVALID_REASON_USERNAME_VENDOR_RULES]: 'invalid username before @ by domain vendor rules',
    [INVALID_REASON_DOMAIN_POPULAR_TYPO]: 'typo in domain',
}

type ValidatorOptions = {
    blocklistDomains?: string[],
    dohProviderUrl?: string,
    dohRetryAmount?: number,
    skipCache?: boolean,
    mxResolver?: (domain: string) => Promise<string[] | false>,
}

const OptionsDefaults: ValidatorOptions = {
    blocklistDomains: BLOCKLIST_DOMAINS_EXAMPLE,
    dohRetryAmount: 3,
    skipCache: false,
}

type ValidationResult = {
    valid: boolean,
    reasonId?: number,
    reasonText?: string,
}

function withReasonText(result: ValidationResult): ValidationResult {
    result.reasonText = INVALID_REASON_TEXT[result.reasonId];
    return result;
}

export async function validateEmail(email: string, options: ValidatorOptions = OptionsDefaults): Promise<ValidationResult> {
    if (typeof options !== 'object' || options === null) {
        throw new Error('Options parameter must be an object');
    }
    email = String(email).toLowerCase().trim();
    let parts = email.split('@');
    if (!parts || parts.length !== 2) {
        return withReasonText({valid: false, reasonId: INVALID_REASON_AMOUNT_OF_AT});
    }
    let [username, domain] = parts;
    if (USERNAME_MAIN_RULE.test(username) === false) {
        return withReasonText({valid: false, reasonId: INVALID_REASON_USERNAME_GENERAL_RULES});
    }
    if (!checkDomain(domain)) {
        return withReasonText({valid: false, reasonId: INVALID_REASON_DOMAIN_GENERAL_RULES});
    }
    if (!checkPopularTypos(domain)) {
        return withReasonText({valid: false, reasonId: INVALID_REASON_DOMAIN_POPULAR_TYPO});
    }
    let mxDomains = await getMxDomains(domain, options);
    if (mxDomains === false) {
        // problem with getting MX records - can't be sure
        return {valid: true};
    }
    if (!mxDomains.length) {
        return withReasonText({valid: false, reasonId: INVALID_REASON_NO_DNS_MX_RECORDS});
    }
    for (let mxDomain of mxDomains) {
        if (options.blocklistDomains && options.blocklistDomains.length
            && (options.blocklistDomains.includes(mxDomain) || options.blocklistDomains.includes(domain))) {
            return withReasonText({valid: false, reasonId: INVALID_REASON_DOMAIN_IN_BLOCKLIST});
        }
        if (!checkProviderRules(username, domain, mxDomain)) {
            return withReasonText({valid: false, reasonId: INVALID_REASON_USERNAME_VENDOR_RULES});
        }
    }
    return {
        valid: true,
    };
}

function checkDomain(domain: string) {
    if (DOMAIN_RULE.test(domain) === false) {
        return false;
    }
    if (domain.startsWith('.')) {
        return false;
    }
    if (domain.endsWith('.')) {
        return false;
    }
    return true;
}

function checkPopularTypos(domain: string) {
    return !POPULAR_DOMAIN_TYPOS.includes(domain);
}

function checkProviderRules(username: string, domain: string, mxDomain: string) {
    if (domain === 'gmail.com') {
        if (username.startsWith('.') || username.endsWith('.') || username.includes('..')) {
            return false;
        }
    }
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

async function getMxDomains(emailDomain: string, options: ValidatorOptions): Promise<string[] | false> {
    if (!options.skipCache && mx_domains_cache[emailDomain]) {
        return [mx_domains_cache[emailDomain]];
    }
    let records: string[] | false;
    if (options.mxResolver) {
        records = await options.mxResolver(emailDomain);
    } else {
        records = await getMxRecords(emailDomain, options);
    }
    if (records === false) {
        return false;
    }
    let result = [];
    records.map(record => {
        record = record.toLowerCase().trim();
        if (!record || record === '') {
            return;
        }
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

async function getMxRecords(emailDomain: string, options: ValidatorOptions): Promise<string[] | false> {
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
    if (options.dohProviderUrl && options.dohProviderUrl.length > 3) {
        let response = await fetch(options.dohProviderUrl + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: {accept: 'application/dns-json'}
        });
        return processDohResponse(response);
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
            if (iteration < options.dohRetryAmount) {
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
