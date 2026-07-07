# Apartment Manager Fix Notes

## Files fixed

- `prisma/schema.prisma`
- `src/lib/session.ts`
- `middleware.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/login/page.tsx`
- `src/app/api/bills/generate/route.ts`
- `src/app/dashboard/bills/generate/page.tsx`
- `src/app/dashboard/bills/generate/GenerateForm.tsx`
- `src/app/dashboard/rooms/page.tsx`
- `src/app/dashboard/rooms/[id]/page.tsx`
- `src/app/dashboard/applications/page.tsx`
- `src/app/dashboard/applications/[id]/movein/page.tsx`
- `.env.example`

## Main fixes

1. Fixed move-out bug by making `Tenant.roomId` nullable.
2. Fixed room list and room detail relation loading.
3. Added safe transaction for add tenant, move out, move in, and bill generation.
4. Added visible `Move In` button in Applications.
5. Added validation for meter readings.
6. Removed hardcoded session-secret fallback.
7. Improved login placeholders and basic failed-login protection.
8. Added `.env.example`.

## After pasting these files

Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run build
```

For production, set these Vercel environment variables:

```env
DATABASE_URL=
SESSION_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

`SESSION_SECRET` must be at least 32 characters.
