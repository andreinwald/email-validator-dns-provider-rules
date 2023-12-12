import {isValidEmail} from '../src';


let emails = {
    'someone@gmail.com': true,
    'some-one@gmail.com': false,
    'some_one@gmail.com': false,
    'someone@yahoo.com': true,
    'some+one@yahoo.com': false,
    'someone@hotnail.com': false,
    'someone@av7w8nyt87a34ntv87a34ntv78.com': false,
};
for (let email in emails) {
    test(email, () => isValidEmail(email).then(result => expect(result).toBe(emails[email])));
}
