import {isValidEmail} from '../src';


test('some run', () => isValidEmail('someone@gmail.com').then(result => expect(result).toBe(true)));

