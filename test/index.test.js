import {isValidEmail} from '../src';


// a lot of tests with hotmail.com bc his rules same as main rule and this domain has MX record

let emails = {
    'someone@gmail.com': true,
    'some-one@gmail.com': false,
    'some_one@gmail.com': false,
    'someone@yahoo.com': true,
    'some+one@yahoo.com': false,
    'someone@hotnail.com': false,
    'someone@av7w8nyt87a34ntv87a34ntv78.com': false,
    'name/surname@hotmail.com': false,
    'name\\surname@hotmail.com': false,
    '"john.doe"@hotmail.com': false,
    '"very.(),:;<>[]\".VERY.\"very@\\ \"very\".unusual"@hotmail.com': false,
    'user+@hotmail.com': true,
    'I❤️CHOCOLATE🍫@hotmail.com': false,
    '1234567890123456789012345678901234567890123456789012345678901234+x@hotmail.com': false,
    'someone@3ffff.f': false,
};
for (let email in emails) {
    test(email, () => isValidEmail(email).then(result => expect(result).toBe(emails[email])));
}


test('passing blocklisted domain', () => isValidEmail('someone@hotmail.com', ['hotmail.com']).then(result => expect(result).toBe(false)));
test('passing DOH provider', () => isValidEmail('someone@hotmail.com', null, 'https://doh.sb/dns-query').then(result => expect(result).toBe(true)));
