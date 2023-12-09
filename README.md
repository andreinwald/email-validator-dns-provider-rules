# Email-validator-dns-provider-rules
Smart Email Validator with checking DNS MX records and email providers rules (like Gmail).<br>
Works in browser. DNS query by DOH.

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



Email rules:
- https://en.wikipedia.org/wiki/Email_address#Examples
- https://support.google.com/mail/answer/9211434?hl=en
- 

---
https://www.npmjs.com/package/email-validator-dns-provider-rules
