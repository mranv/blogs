# Newsletter Subscription System Setup Guide

## Architecture

```
[Newsletter.astro component] 
    -> POST /api/subscribe (Cloudflare Pages Function)
        -> [Buttondown/ConvertKit/Mailchimp/Resend API]
```

## Recommended Service: Buttondown

| Feature | Buttondown | ConvertKit | Mailchimp | Resend |
|---|---|---|---|---|
| Free tier | 1,000 subs | 1,000 subs | 500 subs | 100 contacts |
| Cost at 1K | Free | Free | $13/mo | Free |
| Cost at 5K | $29/mo | $25/mo | $33/mo | $20/mo |
| API simplicity | Excellent | Good | Complex | Good |
| Double opt-in | Yes | Yes | Yes | No |
| GDPR tools | Yes | Yes | Yes | Limited |

### Why Buttondown
- Best free tier: 1,000 subscribers free
- Simple REST API: single endpoint to subscribe
- Privacy-first with GDPR tools
- RSS-to-email: auto-send from your RSS feed
- Made for developers with webhooks and Markdown support

## Setup

1. Create a Buttondown account at buttondown.email
2. Get your API key from Settings > API Keys
3. Set Cloudflare Pages env vars:
   - NEWSLETTER_PROVIDER=buttondown
   - BUTTONDOWN_API_KEY=your-key
4. Deploy and test with: curl -X POST /api/subscribe

See the component props and full details in source code.
