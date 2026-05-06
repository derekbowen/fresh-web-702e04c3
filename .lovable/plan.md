Here’s what you’ve got right now, and what I recommend.

The admin dashboard already exists. The current main dashboard route is:

```text
/admin/dashboard
```

The stable published Lovable URL for that route is:

```text
https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1.lovable.app/admin/dashboard
```

But the reason it showed **Forbidden** is not the URL. The URL is reaching the app. The issue is access control: only users with an `admin` role in the backend can get into admin tools.

There are currently four admin accounts in the backend:

```text
Derek Bowen
Michelle Lupo
brandon
Matthew Ryan
```

If you or a helper logs in with a different account, the dashboard rejects them. That is good security, but the onboarding flow is too confusing right now.

## Plan

1. Add a clean short admin entry route

Create this route inside the app:

```text
/admin
```

It will redirect to:

```text
/admin/dashboard
```

So your easy permanent link can be:

```text
https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1.lovable.app/admin
```

And your shortlink can point here:

```text
go.poolrentalnearme.com/admin
→ https://project--4831238c-ae4b-468a-bfd8-41cba26ba0b1.lovable.app/admin
```

That gives you one easy link to send to helpers.

2. Improve the “not allowed” experience

Right now, if someone logs in but is not an admin, they just get bounced or see a vague **Forbidden** message.

I’ll make the admin check more helpful:

- If they are not logged in, send them to sign in.
- If they are logged in but not an admin, show an “Admin access required” page.
- Show the signed-in email / user ID so you can tell me exactly who needs access.
- Include simple instructions: “Ask an existing admin to grant access.”

3. Add an admin-only “team access” page

Add a page like:

```text
/admin/team
```

Only existing admins can open it.

On that page, admins can:

- See current admin users.
- Add another admin by user ID or, if available from profile data, by email.
- Remove an admin role from someone else.
- Avoid accidentally removing the last admin.

This gives you a real way to manage helpers without asking me to manually patch access every time.

4. Keep it secure

I will not make this a public “anyone with the link is admin” page. That would be dangerous.

The link can be public. The dashboard cannot be public.

The correct setup is:

```text
Anyone can open /admin
Only invited admin users can enter the dashboard
```

5. Optional immediate fix after this

Once the better blocked-access screen exists, you or any helper can open:

```text
/admin
```

If they are blocked, they can copy the displayed user ID/email and send it to you. Then either:

- you add them from `/admin/team`, or
- I can add the first missing admin role if you tell me which account should be allowed.

## Technical details

- Keep roles in `public.user_roles`, not on user/profile records.
- Keep admin validation server-side through the existing `checkAdminRole` / `has_role` pattern.
- Add `/admin` as a route file that redirects to `/admin/dashboard`.
- Add a shared admin guard/result so every admin page handles unauthorized users consistently.
- Add server functions for listing and updating admin roles, using server-only privileged backend access.
- Do not touch marketplace routes, DNS, proxy settings, asset paths, or SEO routes.