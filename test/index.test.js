import {isValidEmail} from '../src';


let emails = {
    'someone@gmail.com': true,
    'some-one@gmail.com': false,
    'some_one@gmail.com': false,
    'someone@yahoo.com': true,
    'some+one@yahoo.com': false,
};
for (let email in emails) {
    test(email, () => isValidEmail(email).then(result => expect(result).toBe(emails[email])));
}
