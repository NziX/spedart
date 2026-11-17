declare namespace NodeJS {
  interface ProcessEnv {
    MONGOURL: string;
    PAWAPAY_BASE_URL_PROD: string;
    PAWAPAY_BASE_URL_DEV: string;
    PAWAPAY_TOKEN: string;
    ENVIRONMENT: "development" | "production";
    EMAIL: string;
    PASSWORD: string;
    MOMO_SUBSCRIPTION_KEY: string;
    MOMO_API_USER: string;
    MOMO_API_KEY: string;
    BASE64KEY: string;
    X_TARGET_ENV: "sandbox" | "mtnrwanda";
    MOMO_BASE_URL: string;
    PAYPACK_BASE_URL: string;
    PAYPACK_APPLICATION_ID: string;
    PAYPACK_APPLICATION_SECRET: string;
  }
}
