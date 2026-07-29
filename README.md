# Official Prank Club Website

## Included
- Direct-link prank: no name input or login for visitors
- Mobile and desktop responsive cyber terminal UI
- Delayed final reveal after “Hack successful...”
- Anonymous analytics: open time, device type, browser, screen size, referrer, session duration, reveal reached
- Supabase email/password protected admin dashboard
- CSV export

## Setup
1. Create a Supabase project.
2. Open SQL Editor and run `supabase.sql`.
3. In Supabase Authentication > Users, create this admin user:
   - Email: `mohitkumar6396105@gmail.com`
   - Set your own password.
4. In Project Settings > API, copy Project URL and anon public key.
5. Paste both values in `config.js`.
6. Upload all files to GitHub Pages, Netlify or another static host.
7. Visitor link: `index.html`
8. Admin link: `admin.html`

## Important safety/privacy notes
- This project does not access photos, contacts, passwords, OTPs, microphone, camera, or exact location.
- The “hack” is only an animation and is revealed as a prank.
- Avoid sending it to anyone with a heart condition, severe anxiety, or someone likely to panic.
- The admin dashboard identifies anonymous browser visitors, not real names.

## Testing locally
Use VS Code Live Server or another local web server. Opening the file directly may block some browser features.


## Latest update
- Terminal code is bright green.
- Final result shows red HACKED, then PRANK.
- Visitors can send one short message (maximum 140 characters).
- Run the updated `supabase.sql` again so the new message columns are added.
- Messages appear in `admin.html` analytics and CSV export.


## Message service fix
Run the final ALTER/INDEX lines in supabase.sql, then replace the GitHub files. The page now updates its own row using a random session key and does not require public SELECT access.
