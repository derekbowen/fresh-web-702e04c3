Insert an `admin` role row into `public.user_roles` for user `mamapalowa@gmail.com` (id `3cc16ea5-43f6-4071-a0cc-f27ea424923c`).

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('3cc16ea5-43f6-4071-a0cc-f27ea424923c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

After approval she'll have full admin access on next page load (may need to sign out / back in).