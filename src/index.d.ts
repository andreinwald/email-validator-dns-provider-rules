export function isValidEmail(email: string, blocklistDomains?: [] | null, dohProvider?: string | null): Promise<boolean>;

export function getLastInvalidReasonId(): boolean;

export function getLastInvalidText(): string | boolean;

export function getMxDomains(emailDomain: string, dohProvider?: string | null): Promise<any>;

export const INVALID_REASON_AMOUNT_OF_AT: 1;
export const INVALID_REASON_USERNAME_GENERAL_RULES: 2;
export const INVALID_REASON_DOMAIN_GENERAL_RULES: 3;
export const INVALID_REASON_NO_DNS_MX_RECORDS: 4;
export const INVALID_REASON_DOMAIN_IN_BLOCKLIST: 5;
export const INVALID_REASON_USERNAME_VENDOR_RULES: 6;
