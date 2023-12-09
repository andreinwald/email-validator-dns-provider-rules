import psl from "psl";
let email = 'somebody@gmail.com';


export async function isValidEmail(email) {
    let regexMatch = Boolean(String(email)
        .toLowerCase()
        .match(
            // /^\S+@\S+\.\S+$/
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        ));
    if (!regexMatch) {
        return false;
    }
    let parts = email.split('@');
    if (parts.length > 2) {
        return false;
    }
    let domain = parts[1];
    let mxRecords = await getMxRecords(domain);
    if (!mxRecords) {
        return false;
    }
    return true;
}

async function getMxRecords(domain) {
    return fetch('https://doh.sb/dns-query?type=MX&name=' + domain)
        .catch(() => {
            return false;
        })
        .then(async response => {
            if (!response.ok) {
                return false;
            }
            let data = await response.json();
            if (!data || !data['Answer'] || Array.isArray(!data['Answer']) || !data['Answer'].length) {
                return false;
            }
            let result = [];
            data['Answer'].map(row => {
                result.push(row.data.substring(row.data.indexOf(' ') + 1))
            });
            return result;
        });
}
