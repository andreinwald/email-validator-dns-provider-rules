import {isValidEmail} from '../src';


test('some run', () => isValidEmail('asd@gmail.com').then(result => expect(result).toBe(true)));

