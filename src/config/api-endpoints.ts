export const API_ENDPOINTS = {
  SYSTEM: {
    HEALTH: "/api/system/health",
  },
  AUTH: {
    SIGN_UP: "/api/auth/sign-up",
    SIGN_IN: "/api/auth/sign-in",
    SIGN_OUT: "/api/auth/sign-out",
    SIGN_OUT_EVERYWHERE: "/api/auth/sign-out-everywhere",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESEND_VERIFICATION_OTP: "/api/auth/resend-verification-otp",
    CURRENT_USER: "/api/auth/me",
  },
} as const;

export const BACKEND_ENDPOINTS = {
  SYSTEM: {
    HEALTH: "/api/v1/health",
  },
  AUTH: {
    SIGN_UP: "/api/v1/auth/sign-up",
    SIGN_IN: "/api/v1/auth/sign-in",
    SIGN_OUT: "/api/v1/auth/sign-out",
    SIGN_OUT_EVERYWHERE: "/api/v1/auth/sign-out-everywhere",
    VERIFY_EMAIL: "/api/v1/auth/verify-email",
    RESEND_VERIFICATION_OTP: "/api/v1/auth/resend-verification-otp",
    CURRENT_USER: "/api/v1/auth/me",
  },
} as const;

type ValueOf<T> = T extends unknown ? T[keyof T] : never;
type EndpointGroup = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

export type ApiEndpoint = ValueOf<EndpointGroup>;

type BackendEndpointGroup = (typeof BACKEND_ENDPOINTS)[keyof typeof BACKEND_ENDPOINTS];

export type BackendEndpoint = ValueOf<BackendEndpointGroup>;
