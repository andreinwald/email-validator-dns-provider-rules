# Email validator with DNS check and provider's rules
Examples, that other validators pass:

| invalid email                         | reason                                                                               |
|-------------------------------|--------------------------------------------------------------------------------------|
| som_e-one@gmail.com           | Gmail don't allows "_" and "-" symbols                                               | 
| someone@8avymt4v93mvt3t03.com | "8avymt4v93mvt3t03.com" isn't real domain and dont have DNS MX records               | 
| s!o#m$e%o^n&e@realdomain.com  | 99.99% public email providers allow only "a-z","0-9",".","_","-","+" before "@" part |
| someone@hotnail.com | possibility of adding your blocklist of domains and MX domains                       |

Works in **Browser** and Node. TypeScript and JavaScript.

# Usage
Please install [NPM package](https://www.npmjs.com/package/email-validator-dns-provider-rules) (works in browser also)
```shell
npm install email-validator-dns-provider-rules --save
```
Validation:
```js
import { isValidEmail } from "email-validator-dns-provider-rules";

if (!await isValidEmail('someone@gmail.com')) {
    alert('Your email is invalid');
}
```
Showing details:
```js
import { isValidEmail, getLastInvalidText } from "email-validator-dns-provider-rules";

if (!await isValidEmail('someone@gmail.com')) {
    alert('Please correct your email: ' + getLastInvalidText());
}
```

# Your version of invalid reasons text
You can use getLastInvalidReasonId() and make dictionary with your version of text: 
```js
const CUSTOM_INVALID_TEXT = {
    [INVALID_REASON_AMOUNT_OF_AT]: 'no @ symbol or too many of them',
    [INVALID_REASON_USERNAME_GENERAL_RULES]:
        'invalid username before @ by general email rules',
    [INVALID_REASON_DOMAIN_GENERAL_RULES]:
        'invalid domain after @ by general domain rules',
    [INVALID_REASON_NO_DNS_MX_RECORDS]: 'domain after @ has no DNS MX records',
    [INVALID_REASON_DOMAIN_IN_BLOCKLIST]: 'email domain is in blocklist',
    [INVALID_REASON_USERNAME_VENDOR_RULES]:
        'invalid username before @ by domain vendor rules',
};
```

# Passing your blocklist domains
```js
const yourBlocklistDomains = ['somedomain.com', '...'];
isValidEmail('someone@gmail.com', yourBlocklistDomains);
```

# Passing your DOH provider
You can choose other DNS over HTTPS provider or even create your own
```js
isValidEmail('someone@gmail.com', null, 'https://your-provider-site/dns-query');
```

# Testing
```shell
npm test
```

### Generating d.ts
```shell
npm i -g typescript
tsc
```
