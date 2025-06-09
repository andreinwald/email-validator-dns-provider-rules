# Email validator with DNS check and provider's rules

Examples, that other validators pass:

| invalid email                 | reason                                                                               |
|-------------------------------|--------------------------------------------------------------------------------------|
| som_e-one@gmail.com           | Gmail don't allows "_" and "-" symbols                                               | 
| someone@8avymt4v93mvt3t03.com | "8avymt4v93mvt3t03.com" isn't real domain and dont have DNS MX records               | 
| s!o#m$e%o^n&e@realdomain.com  | 99.99% public email providers allow only "a-z","0-9",".","_","-","+" before "@" part |
| someone@hotnail.com           | possibility of adding your blocklist of domains and MX domains                       |

Works in **Browser** and Node. TypeScript and JavaScript.

# Usage

Please install [NPM package](https://www.npmjs.com/package/email-validator-dns-provider-rules)

```shell
npm install email-validator-dns-provider-rules
```

Validation:

```js
import {validateEmail} from "email-validator-dns-provider-rules";

const result = await validateEmail('someone@gmail.com');
if (!result.valid) {
    alert(`Your email is invalid: ${result.reasonText}`);
}
```

# Your version of invalid reasons text

You can map result.reasonId with your version of text:

```js
const customReasons = {
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

const result = await validateEmail('someone@gmail.com');
if (!result.valid) {
    alert(`Your email is invalid: ${customReasons[result.reasonId]}`);
}
```

# Passing your blocklist domains

```js
const yourBlocklistDomains = ['somedomain.com', '...'];
validateEmail('someone@gmail.com', {blocklistDomains: yourBlocklistDomains});
```

# Passing your DOH provider

You can choose other DNS over HTTPS provider or even create your own

```js
validateEmail('someone@gmail.com', {dohProviderUrl: 'https://your-provider-site/dns-query'});
```

# Using with Node.js

You also can use this library for double checking on **backend side**.<br>
In this case you can specify own mxResolver function that uses Node package DNS:

```typescript
import {resolveMx} from 'dns/promises';

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

validateEmail('someone@gmail.com', {mxResolver: nodeResolver});
```
