import psl from "psl";
import mx_domains_cache from "./mx_domains_cache.js";

const mainRule = /^[a-z0-9._\-+]+$/
const providerRestricted = {
    'google.com': /[_\-]/, // https://support.google.com/mail/answer/9211434?hl=en
    'yahoodns.net': /\+/, // https://login.yahoo.com/account/create
}

export async function isValidEmail(email) {
    email = String(email).toLowerCase();
    let parts = email.split('@');
    if (!parts || parts.length > 2) {
        console.log('amount of @ symbols');
        return false;
    }
    let username = parts[0];
    let domain = parts[1];
    if (mainRule.test(username) === false) {
        console.log('invalid symbols in username');
        return false;
    }
    let mxDomains = await getMxDomains(domain);
    console.log(mxDomains);
    if (!mxDomains) {
        console.log('no mxDomains');
        return false;
    }
    for (let mxDomain of mxDomains) {
        if (!checkProviderRules(username, domain, mxDomain)) {
            console.log('not by vendor rule', mxDomain);
            return false;
        }
    }
    return true;
}

export async function getMxDomains(emailDomain) {
    if (mx_domains_cache[emailDomain]) {
        console.log('from cache');
        return new Promise((resolve) => {
            resolve([mx_domains_cache[emailDomain]]);
        });
    }

    return fetch('https://doh.sb/dns-query?type=MX&name=' + emailDomain)
        .catch(() => {
            return false;
        })
        .then(async response => {
            if (!response.ok) {
                return false;
            }
            let data = await response.json();
            if (!data || !data['Answer'] || Array.isArray(!data['Answer']) || !data['Answer'].length) {
                console.log('problems with data', data);
                return false;
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
            if (!result.length) {
                return false;
            }
            return result;
        });
}

function checkProviderRules(username, domain, mxDomain) {
    if (mxDomain === 'google.com' && domain !== 'gmail.com') {
        mxDomain = 'google_workplace';
    }
    if (domain === 'gmail.com' && username.includes('+')) {
        username = username.substring(0, username.indexOf('+'));
    }
    if (!providerRestricted[mxDomain]) {
        console.log('nothing in provider rules', username, domain, mxDomain)
        return true;
    }
    return !providerRestricted[mxDomain].test(username);
}
