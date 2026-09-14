# Agenda

A live agenda site: today's date, a GitHub-style activity grid, editable goals with
progress bars, a working-on list, and a notes section.

Anyone with the link can **read** it. Editing is gated behind an edit key, so you can
share the URL with colleagues or a client without them changing your goals.

- React 19 + Vite, no UI framework
- Jost throughout (Google Fonts)
- Cloudflare Pages for hosting, Pages Functions + KV for storage

## How the pieces fit

| Path | What it does |
| --- | --- |
| `src/App.tsx` | State, debounced autosave, lock/unlock |
| `src/api.ts` | Talks to the Function; falls back to localStorage if it can't |
| `src/components/ActivityGrid.tsx` | 53-week contribution grid |
| `functions/api/agenda.ts` | `GET` public read, `PUT` key-gated write |
| `functions/api/unlock.ts` | `POST` validates an edit key |

Completing an item credits today on the activity grid. Un-checking it removes the credit
from whichever day it was originally completed. Deleting a finished item leaves its credit
alone — the work still happened.

## Local development

```bash
npm install
npm run dev
```

`npm run dev` runs the React app alone. Cloudflare Functions don't exist in that mode, so
the app detects the missing API and saves to `localStorage` instead, showing a "Local
preview" banner. That's fine for working on the UI.

To run the real thing — Functions and KV included:

```bash
echo "EDIT_KEY=localtest" > .dev.vars
npm run dev:full
```

Then open http://localhost:8788 and unlock with `localtest`.

## Deploying

### 1. Create the KV namespace

```bash
npx wrangler kv namespace create AGENDA_KV
```

The dashboard route works too: from **Account Home** (not a specific domain — KV is
account-level), go to **Storage & Databases → Workers KV → Create instance**. Either way
you only need the namespace to exist; the binding in step 4 is what actually wires it up.

### 2. Push to GitHub

```bash
git remote add origin https://github.com/<you>/agenda-site.git
git push -u origin main
```

### 3. Connect Cloudflare Pages

In the Cloudflare dashboard: **Workers & Pages → Create application → Pages → Connect to
Git**. Authorize GitHub, pick the repo, then under **Set up builds and deployments**:

- **Production branch:** `main`
- **Framework preset:** None
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Cloudflare picks up `functions/` automatically — no extra config.

The first deploy will succeed but the site won't save yet. That's expected; the bindings
come next.

### 4. Add the bindings

**Settings → Bindings → Add → KV namespace:**

- **Variable name:** `AGENDA_KV` (must match exactly — the Function reads `env.AGENDA_KV`)
- **KV namespace:** the one from step 1

**Settings → Variables and Secrets → Add:**

- **Type:** Secret
- **Name:** `EDIT_KEY`
- **Value:** your edit password

Add both to **Production** (and Preview, if you want preview deploys to work).

### 5. Redeploy

Bindings only attach on a fresh build, so the deploy from step 3 still doesn't have them.
Trigger a redeploy from the **Deployments** tab, or push a commit.

## Security notes

- The edit key is a single shared password, checked server-side on every write. It's
  appropriate for keeping casual visitors out of your agenda. It is not account-grade
  auth — don't put anything confidential in the notes field.
- `EDIT_KEY` is only ever compared inside the Function; it never reaches the browser.
- If `EDIT_KEY` isn't configured, writes are refused outright rather than left open.
- The key is held in `sessionStorage`, so closing the tab re-locks the site.
