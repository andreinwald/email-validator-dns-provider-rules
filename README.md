# Email Validator with DNS Check and Provider Rules

A robust email validation library that goes beyond basic regex validation by checking:

1. DNS MX records to verify domain existence
2. Provider-specific rules for usernames (e.g., Gmail, Yahoo)
3. Common domain typos (e.g., "gmial.com" instead of "gmail.com")
4. Custom domain blocklists

## Why Use This Library?

Most email validators only check basic syntax, allowing many invalid emails to pass. This library catches emails that
other validators miss:

| Invalid Email                 | Reason                                                                        |
|-------------------------------|-------------------------------------------------------------------------------|
| som_e-one@gmail.com           | Gmail doesn't allow "_" and "-" symbols                                       | 
| someone@8avymt4v93mvt3t03.com | "8avymt4v93mvt3t03.com" isn't a real domain and doesn't have DNS MX records   | 
| s!o#m$e%o^n&e@realdomain.com  | Most public email providers only allow "a-z","0-9",".","_","-","+" before "@" |
| someone@hotnail.com           | Common typo that can be blocked with the domain blocklist feature             |

## Features

- Works in both **Browser** and **Node.js** environments
- Written in TypeScript with full type definitions
- Zero dependencies
- Customizable validation rules
- DNS-over-HTTPS (DoH) support for browser environments
- Custom MX resolver support for Node.js
- Domain blocklist support
- Detailed validation error reasons

## Installation

```shell
# NPM
npm install email-validator-dns-provider-rules

# Yarn
yarn add email-validator-dns-provider-rules

# pnpm
pnpm add email-validator-dns-provider-rules
```

## Basic Usage

```js
import {validateEmail} from "email-validator-dns-provider-rules";

// Basic validation
const result = await validateEmail('someone@gmail.com');
if (!result.valid) {
    console.log(`Email is invalid: ${result.reasonText}`);
}
```

## API Reference

### validateEmail(email, options)

Validates an email address using DNS checks and provider-specific rules.

**Parameters:**

- `email` (string): The email address to validate
- `options` (object, optional): Configuration options

**Returns:**

- Promise<ValidationResult>: Object with validation results

**ValidationResult Object:**

- `valid` (boolean): Whether the email is valid
- `reasonId` (number, optional): ID of the validation failure reason
- `reasonText` (string, optional): Human-readable description of the validation failure

### Options

```typescript
interface ValidatorOptions {
    blocklistDomains?: string[];      // Domains to block
    dohProviderUrl?: string;          // Custom DNS-over-HTTPS provider URL
    dohRetryAmount?: number;          // Number of retries for DNS queries
    skipCache?: boolean;              // Skip the internal MX domain cache
    mxResolver?: (domain: string) => Promise<string[] | false>; // Custom MX resolver
}
```

## Customizing Error Messages

You can provide your own error messages by mapping the reason IDs:

```js
const customReasons = {
    [INVALID_REASON_AMOUNT_OF_AT]: 'Email must contain exactly one @ symbol',
    [INVALID_REASON_USERNAME_GENERAL_RULES]: 'Username contains invalid characters',
    [INVALID_REASON_DOMAIN_GENERAL_RULES]: 'Domain name is invalid',
    [INVALID_REASON_NO_DNS_MX_RECORDS]: 'Domain does not have mail server records',
    [INVALID_REASON_DOMAIN_IN_BLOCKLIST]: 'This email domain is not allowed',
    [INVALID_REASON_USERNAME_VENDOR_RULES]: 'Username does not meet provider requirements',
    [INVALID_REASON_DOMAIN_POPULAR_TYPO]: 'Domain appears to be a typo (did you mean gmail.com?)',
};

const result = await validateEmail('someone@gmail.com');
if (!result.valid) {
    console.log(`Email is invalid: ${customReasons[result.reasonId]}`);
}
```

## Using Domain Blocklists

You can block specific domains:

```js
const blockedDomains = [
    'disposable-email.com',
    'temporary-mail.org',
    'hotnail.com'  // Common typo of hotmail.com
];

const result = await validateEmail('user@disposable-email.com', {
    blocklistDomains: blockedDomains
});
// result.valid will be false
```

## Custom DNS-over-HTTPS Provider

You can specify a custom DNS-over-HTTPS provider:

```js
const result = await validateEmail('someone@gmail.com', {
    dohProviderUrl: 'https://your-custom-doh-provider.com/dns-query'
});
```

## Node.js Integration

For Node.js environments, you can use the native DNS module:

```typescript
import {resolveMx} from 'dns/promises';

async function nodeResolver(emailDomain: string): Promise<string[] | false> {
    try {
        const records = await resolveMx(emailDomain);
        return records.map(rec => rec.exchange);
    } catch (error) {
        if (error.message.includes('ENOTFOUND')) {
            return []; // Empty records treated as invalid
        }
        return false; // Other errors treated as "can't determine"
    }
}

const result = await validateEmail('someone@gmail.com', {
    mxResolver: nodeResolver
});
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
