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
  FEED: {
    POSTS: "/api/feed/posts",
    POST: (postId: string) => `/api/feed/posts/${postId}`,
    MEDIA_SIGNATURE: "/api/feed/media/signature",
    LIKES: (postId: string) => `/api/feed/posts/${postId}/likes`,
    COMMENTS: (postId: string) => `/api/feed/posts/${postId}/comments`,
    COMMENT: (commentId: string) => `/api/feed/comments/${commentId}`,
    SHARES: (postId: string) => `/api/feed/posts/${postId}/shares`,
    TAGS: "/api/feed/tags",
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
  FEED: {
    POSTS: "/api/v1/feed/posts",
    POST: (postId: string) => `/api/v1/feed/posts/${postId}`,
    MEDIA_SIGNATURE: "/api/v1/feed/media/signature",
    LIKES: (postId: string) => `/api/v1/feed/posts/${postId}/likes`,
    COMMENTS: (postId: string) => `/api/v1/feed/posts/${postId}/comments`,
    COMMENT: (commentId: string) => `/api/v1/feed/comments/${commentId}`,
    SHARES: (postId: string) => `/api/v1/feed/posts/${postId}/shares`,
    TAGS: "/api/v1/feed/tags",
  },
} as const;

export type ApiEndpoint = string;
export type BackendEndpoint = string;
