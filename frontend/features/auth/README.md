# `features/auth`

Registration, login, OTP, refresh, password reset.

## Structure (as it grows)

```
auth/
├── components/
│   ├── login-form.tsx
│   ├── register-form.tsx
│   └── otp-form.tsx
├── api/
│   ├── auth.ts            # axios calls
│   └── mutations.ts       # useLogin, useRegister, useRefresh
├── schemas/
│   ├── login.schema.ts
│   └── register.schema.ts
├── hooks/
│   └── use-auth.ts
├── types/
└── index.ts
```

## Rules

- RHF + Zod for every form.
- httpOnly refresh cookie (set by backend); access token in memory.
- Map server validation errors to fields.
- Rate-limited endpoints — handle 429 gracefully.
