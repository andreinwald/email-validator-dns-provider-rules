# Email validator dns provider rules
**Strict Email Validator** with checking DNS MX records and email providers rules (like Gmail).<br>

- more strict and real validation for symbols before "@"
- check if domain can really receive emails (DNS MX record)
- everything works from browser! (DNS query by DOH)

**Invalid emails that other validators pass:**

| email                         | reason                                                                                |
|-------------------------------|---------------------------------------------------------------------------------------|
| som_e-one@gmail.com           | Gmail don't allows "_" and "-" symbols                                                | 
| someone@8avymt4v93mvt3t03.com | "8avymt4v93mvt3t03.com" isn't real domain and dont have DNS MX records                | 
| s!o#m$e%o^n&e@realdomain.com  | 99.99% public email providers allow only "a-z","0-9",".","_","-","+" before "@" part  |

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

---
https://www.npmjs.com/package/email-validator-dns-provider-rules
