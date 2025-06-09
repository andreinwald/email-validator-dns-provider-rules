import * as validator from '../src';
import {expect, test} from 'vitest'
import {DNS_OVER_HTTPS_PROVIDERS} from "../src";
import {resolveMx} from 'dns/promises';

let validEmails = [
    // hotmail.com username rules same as default
    'someone@hotmail.com',
    'someone22@hotmail.com',
    'some.one@hotmail.com',
    'some_one@hotmail.com',
    'some-one@hotmail.com',
    'some+one@hotmail.com',
    // popular providers
    'someone@yahoo.com',
    'someone@outlook.com',
    'someone@gmail.com',
    'some.one@gmail.com',
];
for (let email of validEmails) {
    test(email, () => validator.validateEmail(email).then((result) => {
            expect(result.valid).toBeTruthy();
        })
    );
}

let reasons = {
    'userotmail.com': validator.INVALID_REASON_AMOUNT_OF_AT,
    'someone@gmail*&#($&#^$': validator.INVALID_REASON_DOMAIN_GENERAL_RULES,
    'someone@.gmail.com': validator.INVALID_REASON_DOMAIN_GENERAL_RULES,
    'someone@gmail.com.': validator.INVALID_REASON_DOMAIN_GENERAL_RULES,
    'some-one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some_one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some+one@yahoo.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    '.someone@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'some..one@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'someone.@gmail.com': validator.INVALID_REASON_USERNAME_VENDOR_RULES,
    'someone@hotnail.com': validator.INVALID_REASON_DOMAIN_IN_BLOCKLIST,
    'someone@domain.invalid': validator.INVALID_REASON_NO_DNS_MX_RECORDS,
    'name/surname@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'name\\surname@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '"john.doe"@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '"very.(),:;<>[]\".VERY. \"very\".unusual"@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'I❤️CHOCOLATE🍫@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    '1234567890123456789012345678901234567890123456789012345678901234+x@hotmail.com': validator.INVALID_REASON_USERNAME_GENERAL_RULES,
    'someone@3ffff.f': validator.INVALID_REASON_DOMAIN_GENERAL_RULES,
    'someone@gamil.com': validator.INVALID_REASON_DOMAIN_POPULAR_TYPO,
    'someone@gmail.fr': validator.INVALID_REASON_NO_DNS_MX_RECORDS,
};

for (let email in reasons) {
    test(email, async () => {
        const result = await validator.validateEmail(email);
        expect(result.valid).toBeFalsy();
        expect(result.reasonId).toBe(reasons[email]);
    })
}

test('text reason', () => validator.validateEmail('some-one@gmail.com')
    .then(result => expect(result.reasonText).toBe('invalid username before @ by domain vendor rules')));
test('passing blocklisted domain', () => validator.validateEmail('someone@hotmail.com', {blocklistDomains: ['hotmail.com']})
    .then(result => expect(result.valid).toBe(false)));

for (let dohProvider of DNS_OVER_HTTPS_PROVIDERS) {
    test('passing DOH provider ' + dohProvider, () => validator.validateEmail('someone@domain.invalid', {dohProviderUrl: dohProvider})
        .then(result => expect(result.valid).toBe(false)));
}

async function nodeResolver(emailDomain: string): Promise<string[] | false> {
    try {
        let records = await resolveMx(emailDomain);
        return records.map(rec => rec.exchange);
    } catch (error) {
        if (error.message.includes('ENOTFOUND')) {
            return []; // empty records treated as invalid
        }
        return false;
    }
}

test('Node MX resolver', async () => {
    const resultInvalid = await validator.validateEmail('someone@domain.invalid', {mxResolver: nodeResolver});
    expect(resultInvalid.valid).toBeFalsy();
    const resultValid = await validator.validateEmail('someone@gmail.com', {
        mxResolver: nodeResolver,
        skipCache: true,
    });
    expect(resultValid.valid).toBeTruthy();
});

