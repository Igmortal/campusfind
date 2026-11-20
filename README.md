# CampusFind – College Lost & Found Portal

Static site (HTML/CSS/JS) + Supabase (database and admin login). Users report lost or found items; moderators approve them; only approved reports are public.

## Files
| File | Purpose |
|---|---|
| `index.html`, `lost.html`, `found.html`, `reports.html` | Public pages |
| `admin.html` + `admin.js` | Moderator dashboard (approve / edit / delete / create) |
| `config.js` | **Your Supabase keys and desk email** |
| `script.js`, `style.css` | Shared logic and styling |
| `setup.sql` | Database tables, security rules, admin check |

## 1. Set up Supabase
1. Open your Supabase project → **SQL Editor** → paste all of `setup.sql` → **Run**.
   - If you already added your own policies on `reports`, delete them under *Authentication → Policies* first.
2. **Authentication → Users → Add user** → create your admin account (email + password, tick *Auto confirm*).
3. In the SQL Editor run (use that same email):
   ```sql
   insert into admins (email) values ('you@yourcollege.edu');
   ```
4. **Authentication → Sign In / Providers** (or *Settings*) → turn **off** "Allow new users to sign up".
5. **Project Settings → API** → copy the **Project URL** and the **anon public** key.

## 2. Configure the site
Open `config.js` and fill in `supabaseUrl`, `supabaseKey` and `deskEmail`.

## 3. Test locally
Install the **Live Server** extension in VS Code → right-click `index.html` → *Open with Live Server*.
1. Submit a report on `lost.html`. It saves as `pending`.
2. Open `admin.html`, sign in, click **Approve**.
3. Check `reports.html` and the homepage; the item now appears.

## 4. Push to GitHub
```bash
git init
git add .
git commit -m "CampusFind"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/campusfind.git
git push -u origin main
```

## 5. Deploy on Vercel
1. vercel.com → **Add New → Project** → import the GitHub repo.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. **Deploy.** Every `git push` redeploys automatically.
4. Supabase → **Authentication → URL Configuration** → set *Site URL* to your Vercel URL.

## Using it
- **Moderators:** `yoursite.vercel.app/admin.html`. Statuses are `pending → approved → returned` (or `rejected`). Use **+ New record** to add one manually.
- **Claims:** the public never sees reporter contact details. Cards have an "I found this / This is mine" email link to `deskEmail`; the desk checks the contact in the dashboard and connects both people.
- Reports that existed before this upgrade stay hidden until you approve them in the dashboard.

## Security notes
- The anon key in `config.js` is meant to be public. Row-level security in `setup.sql` is what protects the data. Never use the `service_role` key.
- Visitors can only insert `pending` reports and only read approved ones, without the contact column.

## Troubleshooting
- **Nothing loads / console errors:** check `config.js` values and that `setup.sql` ran without errors.
- **"This account is not an admin":** the email in `admins` must match the login email exactly.
- **Submit fails:** the `type` value must be `lost` or `found`, and your table needs a `contact` column (added by `setup.sql`).
