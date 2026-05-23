# 📧 Newsletter Setup — Fully Cloudflare-Native

**Total cost: $0/month** — everything runs on Cloudflare. No third-party services.

## Architecture

```
techanv.com (your domain)
  ├── Email Routing (MX/SPF/DKIM ✅ already configured)
  ├── Email Sending (send_email binding → sends from newsletter@techanv.com)
  └── KV (subscriber storage)

[Newsletter.astro widget in sidebar]
  → POST /api/subscribe
    → KV: store pending subscriber
    → send_email: send confirmation (newsletter@techanv.com → reader)

[Reader clicks confirm]
  → GET /api/confirm?token=xxx
    → KV: mark confirmed
    → Shows success page

[You publish a new post]
  → POST /api/admin/broadcast?secret=xxx
    → KV: list all confirmed subscribers
    → send_email: blast newsletter to all (newsletter@techanv.com → each reader)

[Reader unsubscribes]
  → GET /api/unsubscribe?email=xxx
    → KV: remove subscriber
    → Shows goodbye page

[Reader replies to newsletter]
  → Cloudflare Email Routing → forwards to Iamanubhavgain@gmail.com
```

---

## Step-by-Step Setup (10 minutes)

### Step 1: Create KV Namespace

```bash
npx wrangler kv:namespace create "SUBSCRIBERS_KV"
# Output: { binding = "SUBSCRIBERS_KV", id = "xxxx" }
```

### Step 2: Update wrangler.toml

Uncomment the KV section and paste the ID from Step 1:

```toml
[[kv_namespaces]]
  binding = "SUBSCRIBERS_KV"
  id = "xxxx-from-step-1"
```

### Step 3: Add Bindings in Cloudflare Dashboard

Go to **Workers & Pages → mranv blog → Settings → Functions**:

#### KV Namespace Binding
| Variable name | KV namespace |
|---|---|
| `SUBSCRIBERS_KV` | `SUBSCRIBERS_KV` (from Step 1) |

#### Send Email Binding
| Variable name | (no value needed) |
|---|---|
| `SEND_EMAIL` | — (just add the binding) |

### Step 4: Set Environment Variables

**Workers & Pages → mranv blog → Settings → Environment variables:**

| Variable | Value | How to get |
|---|---|---|
| `ADMIN_SECRET` | Random 32-char string | Run: `openssl rand -hex 32` |
| `ADMIN_EMAIL` | `Iamanubhavgain@gmail.com` | Your email |
| `SITE_NAME` | `Anubhav Gain's Blog` | Blog name |
| `SITE_URL` | `https://mranv.pages.dev` | Site URL |
| `NODE_VERSION` | `20` | For build |

### Step 5: (Optional) Email Routing for Reply Handling

You already have Email Routing on techanv.com! To receive replies to newsletter emails:

1. Go to **Email Routing → techanv.com → Routing rules**
2. Add a catch-all rule:
   - **Catch-all** → Forward to `Iamanubhavgain@gmail.com`
3. Now any reply to `newsletter@techanv.com` lands in your Gmail

### Step 6: Verify DNS (already done ✅)

Your techanv.com already has:
- ✅ MX records → `route1/2/3.mx.cloudflare.net`
- ✅ SPF → `v=spf1 include:_spf.mx.cloudflare.net ~all`
- ✅ DKIM → `cf2024-1._domainkey.techanv.com`

No changes needed!

---

## Testing

### Subscribe
```bash
curl -X POST https://mranv.pages.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","ref":"/"}'
```

### Check Stats
```bash
curl "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET"
```

### Send Broadcast
```bash
curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hello from techanv.com!","htmlBody":"<h1>First newsletter</h1><p>Sent via Cloudflare Email Sending.</p>"}'
```

### New Post Notification
```bash
curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"subject":"New Post: eBPF Security Tools","postTitle":"Building eBPF Security Tools in Rust","postUrl":"https://mranv.pages.dev/posts/ebpf-security-rust/"}'
```

---

## Automate New Post Notifications

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
          NEW_POSTS=$(git diff --name-only --diff-filter=A HEAD~1 HEAD -- 'src/content/posts/**/*.md')
          echo "posts=$NEW_POSTS" >> $GITHUB_OUTPUT
      - name: Notify subscribers
        if: steps.posts.outputs.posts
        env:
          ADMIN_SECRET: ${{ secrets.ADMIN_SECRET }}
        run: |
          for post in ${{ steps.posts.outputs.posts }}; do
            SLUG=$(echo "$post" | sed 's|src/content/posts/||;s|\.md$||')
            TITLE=$(grep '^title:' "$post" | head -1 | sed "s/^title: *['\"]//;s/['\"]$//")
            if [ -n "$TITLE" ]; then
              curl -X POST "https://mranv.pages.dev/api/admin/broadcast?secret=${ADMIN_SECRET}" \
                -H "Content-Type: application/json" \
                -d "{\"subject\":\"New Post: ${TITLE}\",\"postTitle\":\"${TITLE}\",\"postUrl\":\"https://mranv.pages.dev/posts/${SLUG}/\"}"
              echo "Notified: $TITLE"
            fi
          done
```

Add `ADMIN_SECRET` to **GitHub → mranv/blogs → Settings → Secrets and variables → Actions**.

---

## KV Data Structure

```
sub:{email}         → { email, ref, subscribedAt, confirmed, confirmedAt }
confirmed:{email}    → { email, confirmedAt, ref }     (fast broadcast listing)
token:{hex}          → email                            (24hr TTL, for confirmation)
```

## Email Flow

| Email | From | Via |
|---|---|---|
| Confirmation | newsletter@techanv.com | send_email binding |
| Newsletter | newsletter@techanv.com | send_email binding |
| Reader reply | reader → newsletter@techanv.com | Email Routing → Gmail |

## Free Tier Limits

| Resource | Limit |
|---|---|
| Email Sending | 100 emails/day (Workers free), 10K/day (paid $5/mo) |
| KV reads | 100K/day |
| KV writes | 1K/day |
| KV storage | 1GB |
| Workers requests | 100K/day |

## Scaling

| Subscribers | Cost |
|---|---|
| 0-100 | **Free** (100 emails/day covers ~50 subs with 2 emails/week) |
| 100-5K | **$5/mo** (Workers paid: 10M req, 10K emails/day) |
| 5K+ | **$20/mo** Buttondown (handles everything, offload email) |
