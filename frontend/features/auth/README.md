# `features/auth`

Registration, login, OTP, refresh, password reset.

## Structure (as it grows)

```
auth/
├── components/
│   ├── forgot-password-form.tsx
│   └── reset-password-form.tsx
├── schemas/
│   ├── forgot-password.schema.ts
│   └── reset-password.schema.ts
└── README.md
```

Axios calls live in `frontend/services/auth.ts` (`forgotPassword`, `resetPassword`).
Login/register remain route-level pages under `app/login` and `app/register`.

## Rules

- RHF + Zod for every form.
- httpOnly refresh cookie (set by backend); access token in memory.
- Map server validation errors to fields.
- Rate-limited endpoints — handle 429 gracefully.
