import * as validator from '../src';
import {expect, test} from 'vitest'


// a lot of tests with hotmail.com bc his rules same as main rule and this domain has MX record

let reasons = {
    'someone@gmail.com': false,
    'someone@yahoo.com': false,
    'user+@hotmail.com': false,
    'userotmail.com': validator.INVALID_REASON_AMOUNT_OF_AT,
    'some-one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some_one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some+one@yahoo.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'someone@hotnail.com': validator.INVALID_REASON_DOMAIN_IN_BLOCKLIST,
    'someone@domain.invalid': validator.INVALID_REASON_NO_DNS_MX_RECORDS,
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
test('text reason', () => validator.isValidEmail('some-one@gmail.com')
    .then(() => expect(validator.getLastInvalidText()).toBe('invalid username before @ by domain vendor rules')));
test('passing blocklisted domain', () => validator.isValidEmail('someone@hotmail.com', ['hotmail.com'])
    .then(result => expect(result).toBe(false)));
test('passing DOH provider', () => validator.isValidEmail('someone@hotmail.com', null, 'https://doh.sb/dns-query')
    .then(result => expect(result).toBe(true)));
