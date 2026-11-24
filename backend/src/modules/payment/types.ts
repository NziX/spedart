export interface IWebHookResponse {
  status: "COMPLETED" | "FAILED";
  amount: string;
  depositId: string;
  payoutId: string;
}

export type TDepositRequest = {
  depositId: string; // UUID format
  amount: string; // Numeric value as string
  currency: "RWF"; // ISO 4217 currency code
  country: "RWA"; // ISO 3166-1 alpha-3 country code
  correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA"; // Specific financial service provider
  payer: {
    type: "MSISDN"; // Mobile Subscriber Integrated Services Digital Number
    address: {
      value: string; // Phone number format
    };
  };
  customerTimestamp: string; // ISO 8601 datetime format
  statementDescription: string; // 4-22 character description
};

export type TPayoutRequest = {
  payoutId: string; // UUID format
  amount: string; // Numeric value as string
  currency: "RWF"; // ISO 4217 currency code
  country: "RWA"; // ISO 3166-1 alpha-3 country code
  correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA"; // Specific financial service provider
  recipient: {
    type: "MSISDN"; // Mobile Subscriber Integrated Services Digital Number
    address: {
      value: string; // Phone number format
    };
  };
  customerTimestamp: string; // ISO 8601 datetime format
  statementDescription: string; // 4-22 character description
};

export enum EEventKind {
  transaction_created = "transaction:created",
  transaction_processed = "transaction:processed",
}

export interface IPaymentResponse {
  created: string;
  status: string;
  depositId: string;
  payoutId: string;
}

export interface ITransactionResponse {
  amount: number;
  client: string;
  merchant: string;
  fee: number;
  kind: "CASHIN" | "CASHOUT";
  ref: string;
  status: string;
  timestamp: string;
}
