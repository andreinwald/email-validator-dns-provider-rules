import psl from "psl";
import mx_domains_cache from "./mx_domains_cache.js";

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

export async function isValidEmail(email, blocklistDomains = null, dohProvider = null) {
    email = String(email).toLowerCase();
    let parts = email.split('@');
    if (!parts || parts.length > 2) {
        console.log('amount of @ symbols');
        return false;
    }
    let [username, domain] = parts;
    if (USERNAME_MAIN_RULE.test(username) === false) {
        console.log('invalid symbols in username or length');
        return false;
    }
    if (DOMAIN_RULE.test(domain) === false) {
        console.log('invalid domain');
        return false;
    }
    let mxDomains = await getMxDomains(domain, dohProvider);
    if (mxDomains === false) {
        // problem with mx request - better pass next
        return true;
    }
    if (!mxDomains.length) {
        console.log('no mxDomains');
        return false;
    }
    for (let mxDomain of mxDomains) {
        if (BLOCKLIST_DOMAINS_EXAMPLE.includes(mxDomain) || BLOCKLIST_DOMAINS_EXAMPLE.includes(domain)) {
            console.log('domain in blocklist');
            return false;
        }
        if (blocklistDomains !== null && (blocklistDomains.includes(mxDomain) || blocklistDomains.includes(domain))) {
            console.log('domain in blocklist');
            return false;
        }
        if (!checkProviderRules(username, domain, mxDomain)) {
            console.log('not by vendor rule', mxDomain);
            return false;
        }
    }
    return true;
}

function checkProviderRules(username, domain, mxDomain) {
    if (mxDomain === 'google.com' && domain !== 'gmail.com') {
        mxDomain = 'google_workplace';
    }
    if (domain === 'gmail.com' && username.includes('+')) {
        username = username.substring(0, username.indexOf('+'));
    }
    if (!USERNAME_PROVIDER_RULES[mxDomain]) {
        console.log('nothing in provider rules', username, domain, mxDomain)
        return true;
    }
    return !USERNAME_PROVIDER_RULES[mxDomain].test(username);
}

export async function getMxDomains(emailDomain, dohProvider = null) {
    if (mx_domains_cache[emailDomain]) {
        console.log('from cache');
        return new Promise((resolve) => {
            resolve([mx_domains_cache[emailDomain]]);
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
        let mxDomain = row.data.substring(row.data.indexOf(' ') + 1);
        let parsed = psl.parse(mxDomain);
        if (!parsed || !parsed.domain) {
            return;
        }
        if (!result.includes(parsed.domain)) {
            result.push(parsed.domain);
        }
    });
    return result;
}

async function getMxRecords(emailDomain, dohProvider = null, retry = 3) {
    let iteration = 0;
    let excludeResolvers = [];

    if (dohProvider !== null && dohProvider.length > 3) {
        return fetch(dohProvider + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: {accept: 'application/dns-json'}
        });
    }

    async function request() {
        let notTriedDomains = DNS_OVER_HTTPS_PROVIDERS.filter(x => !excludeResolvers.includes(x));
        let resolver = notTriedDomains[(Math.floor(Math.random() * notTriedDomains.length))];
        excludeResolvers.push(resolver);
        let response = await fetch(resolver + `?type=MX&name=` + encodeURIComponent(emailDomain), {
            headers: {accept: 'application/dns-json'}
        });
        if (!response.ok) {
            iteration++;
            if (iteration < retry) {
                return request();
            } else return false;
        }
        return response;
    }

    return await request();
}


