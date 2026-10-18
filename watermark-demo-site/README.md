# Lumen Studio — ZER watermark demo site

A complete, self-contained one-page website with the **ZER** preview-protection
SDK already wired in. Host it on GitHub + Vercel to see the watermark live.

It's pure static HTML (no build step), so Vercel deploys it as-is.

## Deploy in 4 steps

### 1. Create a project in ZER
In your ZER dashboard → **Create project**:
- **Allowed domains:** set it to `*` while testing (shows the watermark on any
  domain), or add this site's domain after you deploy (e.g. `lumen-xyz.vercel.app`).
- Copy the project's **public id** (looks like `lg_pub_...`).

### 2. Paste your project id into the site
Open `index.html`, find this line near the top and replace the placeholder:

```html
data-project-id="PASTE_YOUR_ZER_PROJECT_ID_HERE"
```

(The `data-api` is already set to your ZER app, `https://licenseguard-sigma.vercel.app`.)

### 3. Push to GitHub
```bash
git init
git add -A
git commit -m "Lumen Studio demo site"
git branch -M main
git remote add origin https://github.com/<you>/lumen-demo.git
git push -u origin main
```

### 4. Deploy on Vercel
- vercel.com → **Add New… → Project** → import the repo → **Deploy**.
- Vercel detects it as a static site automatically (no settings needed).

## See the watermark

- While the ZER project is **unpaid preview**, visitors to your deployed site
  see the diagonal **"UNPAID PREVIEW — CONTACT TO PURCHASE"** watermark, and
  clicking links/buttons follows your preview rules.
- **Activate** the license in ZER (or set it active) and reload — the watermark
  lifts (allow up to ~60s for the SDK's session cache).

## Notes

- If the watermark doesn't appear: make sure the deployed domain is in the
  project's **Allowed domains** (or that it's set to `*`), and that your ZER app
  (`licenseguard-sigma.vercel.app`) is reachable.
- The whole integration is **one `<script>` tag** in `index.html` — that's all a
  real client site needs.
