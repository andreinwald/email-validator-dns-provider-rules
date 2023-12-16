import * as validator from '../src';


// a lot of tests with hotmail.com bc his rules same as main rule and this domain has MX record

let reasons = {
    'someone@gmail.com': false,
    'someone@yahoo.com': false,
    'user+@hotmail.com': false,
    'some-one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some_one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some+one@yahoo.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'someone@hotnail.com': validator.INVALID_REASON_DOMAIN_IN_BLOCKLIST,
    'someone@av7w8nyt87a34ntv87a34ntv78.com': validator.INVALID_REASON_NO_DNS_MX_RECORDS,
    'name/surname@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'name\\surname@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '"john.doe"@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '"very.(),:;<>[]\".VERY. \"very\".unusual"@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'I❤️CHOCOLATE🍫@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '1234567890123456789012345678901234567890123456789012345678901234+x@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'someone@3ffff.f': validator.INVALID_REASON_DOMAIN_GENERAL_RULES,
};
for (let email in reasons) {
    test(email, () => validator.isValidEmail(email).then((result) => expect(validator.getLastInvalidReasonId()).toBe(reasons[email])));
}
test('passing blocklisted domain', () => validator.isValidEmail('someone@hotmail.com', ['hotmail.com']).then(result => expect(result).toBe(false)));
test('passing DOH provider', () => validator.isValidEmail('someone@hotmail.com', null, 'https://doh.sb/dns-query').then(result => expect(result).toBe(true)));
