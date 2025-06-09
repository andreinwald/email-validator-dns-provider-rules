export declare const DNS_OVER_HTTPS_PROVIDERS: string[];
export declare const INVALID_REASON_AMOUNT_OF_AT = 1;
export declare const INVALID_REASON_USERNAME_GENERAL_RULES = 2;
export declare const INVALID_REASON_DOMAIN_GENERAL_RULES = 3;
export declare const INVALID_REASON_NO_DNS_MX_RECORDS = 4;
export declare const INVALID_REASON_DOMAIN_IN_BLOCKLIST = 5;
export declare const INVALID_REASON_USERNAME_VENDOR_RULES = 6;
export declare const INVALID_REASON_DOMAIN_POPULAR_TYPO = 7;
type ValidatorOptions = {
    blocklistDomains?: string[];
    dohProviderUrl?: string;
    dohRetryAmount?: number;
    skipCache?: boolean;
    mxResolver?: (domain: string) => Promise<string[] | false>;
};
type ValidationResult = {
    valid: boolean;
    reasonId?: number;
    reasonText?: string;
};
export declare function validateEmail(email: string, options?: ValidatorOptions): Promise<ValidationResult>;
export {};
