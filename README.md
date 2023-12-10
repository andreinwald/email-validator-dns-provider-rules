# Email-validator-dns-provider-rules
Smart Email Validator with checking DNS MX records and email providers rules (like Gmail).<br>
Works in browser. DNS query by DOH.
<br>

## Whats special
- more strict and real validation for symbols before "@"
- check if domain can really receive emails (DNS MX record)
- everything works from browser!




# Usage
```shell
npm install email-validator-dns-provider-rules --save
```
```js
import { isValidEmail } from "email-validator-dns-provider-rules";

if (!await isValidEmail('someone@gmail.com')) {
  alert('Please correct your email');
}
```


# Testing
```shell
npm test
```


> Based on real data, 99.9999% of all working emails in a world contains only symbols "a-z","0-9",".","_","-","+" before "@" part.

Email rules:
- https://en.wikipedia.org/wiki/Email_address#Examples
- https://support.google.com/mail/answer/9211434?hl=en
- 

---
https://www.npmjs.com/package/email-validator-dns-provider-rules
