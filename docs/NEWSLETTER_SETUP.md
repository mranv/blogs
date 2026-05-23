# 📧 Newsletter Setup — Fully Cloudflare-Native

**Total cost: $0/month** — no third-party services required.

## Architecture

```
[Newsletter.astro widget]
    → POST /api/subscribe (Cloudflare Pages Function)
        → Cloudflare KV (subscriber storage)
        → MailChannels API (confirmation email)
    → GET /api/confirm?token=xxx (double opt-in)
        → KV: mark subscriber as confirmed

[Your machine / cron]
    → POST /api/admin/broadcast?secret=xxx
        → KV: list all confirmed subscribers
        → MailChannels API (send emails in batches)
```

## What You Get

| Feature | Status |
|---|---|
| Subscribe from sidebar | ✅ Built-in |
| Double opt-in (confirm email) | ✅ MailChannels |
| Unsubscribe link in every email | ✅ One-click |
| Subscriber management (KV) | ✅ Cloudflare KV |
| Broadcast newsletter to all | ✅ Admin API |
| Subscriber stats dashboard | ✅ GET /api/admin/broadcast |
| New post notifications | ✅ Admin API |
| Disposable email blocking | ✅ Built-in |
| Dark-themed email templates | ✅ Custom HTML |

---

## Step-by-Step Setup (15 minutes)

### Step 1: Create KV Namespace

```bash
# Install wrangler CLI (if not already)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create the KV namespace
wrangler kv:namespace create "SUBSCRIBERS_KV"
# Output: { binding = "SUBSCRIBERS_KV", id = "xxxx" }
```

Copy the `id` from the output.

### Step 2: Update wrangler.toml

Uncomment and fill in the KV namespace ID:

```toml
[[kv_namespaces]]
  binding = "SUBSCRIBERS_KV"
  id = "xxxx-xxxx-xxxx"   # ← paste from Step 1
  preview_id = "yyyy-yyyy-yyyy"  # ← for local dev
```

Create preview namespace:
```bash
wrangler kv:namespace create "SUBSCRIBERS_KV" --preview
```

### Step 3: Configure Cloudflare Pages Environment Variables

Go to **Cloudflare Dashboard → Workers & Pages → your blog → Settings → Environment variables**:

| Variable | Value | Production | Preview |
|---|---|---|---|
| `ADMIN_EMAIL` | `your-email@domain.com` | ✅ | ✅ |
| `ADMIN_SECRET` | A random 32-char string | ✅ | ❌ |
| `SITE_NAME` | `Anubhav Gain's Blog` | ✅ | ✅ |
| `SITE_URL` | `https://mranv.pages.dev` | ✅ | ✅ |
| `NODE_VERSION` | `20` | ✅ | ✅ |

Generate a secure admin secret:
```bash
openssl rand -hex 32
```

### Step 4: Configure Cloudflare Pages KV Binding

Go to **Cloudflare Dashboard → Workers & Pages → your blog → Settings → Functions → KV namespace bindings**:

| Variable name | KV namespace |
|---|---|
| `SUBSCRIBERS_KV` | `SUBSCRIBERS_KV` (the one you created) |

### Step 5: Configure MailChannels (Free Email Sending)

MailChannels provides **free email sending for Cloudflare Workers** with no account required.

**Important:** You need to add a **Domain Lock** record to authorize your domain:

1. Go to your domain's DNS settings in Cloudflare
2. Add a **TXT record**:
   - Name: `_mailchannels.mranv.pages.dev` (or your custom domain)
   - Content: `v=mc1 cfid=YOUR_CLOUDFLARE_ACCOUNT_ID`
3. If using a custom domain (not pages.dev), add SPF:
   - TXT record: `@` → `v=spf1 include:relay.mailchannels.net ~all`
4. Add DMARC:
   - TXT record: `_dmarc` → `v=DMARC1; p=none;`

**Get your Cloudflare Account ID:**
```
Cloudflare Dashboard → any domain → Overview → scroll down → Account ID
```

**For pages.dev domains:** MailChannels may not work with pages.dev subdomains.
If you have a custom domain, use that instead. Set `SITE_URL` to your custom domain.

### Step 6: Set Up Email DNS Records (for custom domain)

If using a custom domain (e.g., `gainsaheb.com`):

```dns
# SPF — authorizes MailChannels to send email on your behalf
TXT  @                       v=spf1 include:relay.mailchannels.net ~all

# Domain Lock — links sending to your Cloudflare account
TXT  _mailchannels           v=mc1 cfid=YOUR_CLOUDFLARE_ACCOUNT_ID

# DMARC — tells receivers what to do with unauthenticated mail
TXT  _dmarc                  v=DMARC1; p=none;

# Optional: DKIM via MailChannels (improves deliverability)
# See https://support.mailchannels.com/hc/en-us/articles/200056630
```

---

## Testing

### Subscribe a test email
```bash
curl -X POST https://mranv.pages.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","ref":"/"}'
```

### Check subscriber stats
```bash
curl "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET"
```

### Send a test broadcast
```bash
curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Newsletter",
    "htmlBody": "<h1>Hello!</h1><p>This is a test email.</p>",
    "textBody": "Hello! This is a test email."
  }'
```

### Send new post notification
```bash
curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "New Post: Building eBPF Security Tools",
    "postTitle": "Building eBPF Security Tools in Rust",
    "postUrl": "https://mranv.pages.dev/posts/ebpf-security-rust/"
  }'
```

---

## Automating New Post Notifications

Add a deploy hook that sends notifications after a new post is published:

### Option A: GitHub Actions (recommended)

Create `.github/workflows/notify-newsletter.yml`:

```yaml
name: Notify Newsletter Subscribers
on:
  push:
    branches: [main]
    paths: ['src/content/posts/**']

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - name: Get new posts
        id: posts
        run: |
          # Find new .md files in this commit
          NEW_POSTS=$(git diff --name-only --diff-filter=A HEAD~1 HEAD -- 'src/content/posts/**/*.md')
          echo "posts=$NEW_POSTS" >> $GITHUB_OUTPUT
      - name: Notify subscribers
        if: steps.posts.outputs.posts
        env:
          ADMIN_SECRET: ${{ secrets.ADMIN_SECRET }}
          SITE_URL: https://mranv.pages.dev
        run: |
          for post in ${{ steps.posts.outputs.posts }}; do
            # Extract slug and title from frontmatter
            SLUG=$(echo "$post" | sed 's|src/content/posts/||;s|\.md$||')
            TITLE=$(grep '^title:' "$post" | head -1 | sed "s/^title: *['\"]//;s/['\"]$//")

            if [ -n "$TITLE" ]; then
              curl -X POST "${SITE_URL}/api/admin/broadcast?secret=${ADMIN_SECRET}" \
                -H "Content-Type: application/json" \
                -d "{\"subject\":\"New Post: ${TITLE}\",\"postTitle\":\"${TITLE}\",\"postUrl\":\"${SITE_URL}/posts/${SLUG}/\"}"
              echo "Notified: $TITLE"
            fi
          done
```

Add the secret: **GitHub repo → Settings → Secrets → New secret: `ADMIN_SECRET`**

### Option B: Manual after publishing

```bash
# After pushing a new post:
curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=XXX" \
  -H "Content-Type: application/json" \
  -d '{"subject":"New Post: TITLE","postTitle":"TITLE","postUrl":"URL"}'
```

---

## KV Data Structure

```
sub:{email}        → { email, ref, subscribedAt, confirmed, confirmedAt }
confirmed:{email}   → { email, confirmedAt, ref }   (fast list for broadcast)
token:{token}       → email                          (24hr TTL, for confirmation)
unsub:{email}       → token                          (for unsubscribe verification)
```

## Limits

| Resource | Free Tier | Notes |
|---|---|---|
| KV reads | 100K/day | More than enough |
| KV writes | 1K/day | ~33 new subs/day |
| KV storage | 1GB | Millions of subscribers |
| KV key size | 512 bytes | Email + prefix fits easily |
| KV value size | 25MB | Our JSON is ~200 bytes |
| MailChannels | 3K emails/day (free) | Or use paid Resend/Mailgun at scale |
| Cloudflare Workers | 100K req/day | Handles subscribe/unsubscribe |

## Scaling Beyond Free Tier

If you exceed 1,000 subscribers:
- **$5/month**: Cloudflare Workers Paid (10M req, unlimited KV)
- **$0**: Switch email sending to Resend (100 free emails/day) or Mailgun
- **$20/month**: Buttondown (up to 5K subscribers, handles everything)
