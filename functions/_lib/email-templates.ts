/**
 * TechAnV Consulting — Corporate Email Template Engine
 *
 * Brand Identity (from techanv.com):
 *   Font:   Nunito, -apple-system, sans-serif
 *   Colors: Warm neutrals (hsl 38°), amber accents
 *   Logo:   https://techanv.com/assets/img/logo1.png (442×72)
 *   Tone:   Professional, transparent, integrity-first
 *
 * All templates are table-based for maximum email client compatibility
 * (Gmail, Outlook, Apple Mail, Yahoo, Thunderbird).
 */

// ── Brand Constants ──────────────────────────────────────────────
const BRAND = {
  name:          'TechAnV',
  fullName:      'TechAnV Consulting',
  tagline:       'IT Consulting Services for Optimal Technology',
  logoUrl:       'https://techanv.com/assets/img/logo1.png',
  logoWidth:     140,
  logoHeight:    23,
  siteUrl:       'https://mranv.pages.dev',
  consultingUrl: 'https://techanv.com',
  fromEmail:     'newsletter@techanv.com',
  supportEmail:  'contact@techanv.com',
  year:          new Date().getFullYear(),
} as const;

// ── Color Palette ────────────────────────────────────────────────
const C = {
  bgOuter:      '#f5f0eb',      // warm cream outer
  bgCard:       '#ffffff',      // white card
  bgFooter:     '#f0ebe5',      // slightly darker cream footer
  border:       '#e0d5c9',      // warm border
  textPrimary:  '#1a1410',      // near-black
  textBody:     '#3d3529',      // warm dark brown
  textMuted:    '#7a6f62',      // warm gray
  textFooter:   '#9a8e80',      // muted footer
  accent:       '#b8651a',      // warm amber
  accentHover:  '#a05816',      // darker amber
  accentLight:  '#faf0e6',      // light amber bg
  success:      '#2d7a4f',      // green
  buttonBg:     '#1a1410',      // dark button (matching site)
  buttonText:   '#ffffff',
  linkColor:    '#b8651a',
  divider:      '#e0d5c9',
} as const;

// ── Base Layout ──────────────────────────────────────────────────
function baseHtml(bodyContent: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${previewText}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 0 16px !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bgOuter};font-family:'Nunito',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preview text (hidden in inbox) -->
  <div style="display:none;font-size:1px;color:${C.bgOuter};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${C.bgOuter};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="max-width:560px;background-color:${C.bgCard};border-radius:12px;border:1px solid ${C.border};overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- ── Header / Logo ── -->
          <tr>
            <td align="center" style="padding:32px 40px 24px;border-bottom:1px solid ${C.divider};">
              <a href="${BRAND.siteUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                <img src="${BRAND.logoUrl}" alt="${BRAND.fullName}" width="${BRAND.logoWidth}" height="${BRAND.logoHeight}" style="display:block;border:0;max-width:${BRAND.logoWidth}px;" />
              </a>
            </td>
          </tr>

          <!-- ── Body content ── -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:24px 40px;background-color:${C.bgFooter};border-top:1px solid ${C.divider};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
                      ${BRAND.fullName} &middot; ${BRAND.tagline}
                    </p>
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
                      <a href="${BRAND.consultingUrl}" style="color:${C.linkColor};text-decoration:none;">techanv.com</a>
                      &nbsp;&middot;&nbsp;
                      <a href="${BRAND.siteUrl}" style="color:${C.linkColor};text-decoration:none;">Blog</a>
                      &nbsp;&middot;&nbsp;
                      <a href="mailto:${BRAND.supportEmail}" style="color:${C.linkColor};text-decoration:none;">Contact</a>
                    </p>
                    <p style="margin:0;font-size:11px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
                      &copy; ${BRAND.year} ${BRAND.fullName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /email card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Primary CTA Button ───────────────────────────────────────────
function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" target="_blank" rel="noopener noreferrer"
           style="display:inline-block;padding:14px 36px;background-color:${C.buttonBg};color:${C.buttonText};text-decoration:none;border-radius:8px;font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.01em;mso-padding-alt:0;">
          <!--[if mso]><i style="mso-font-width:400%;mso-text-raise:21pt">&nbsp;</i><![endif]-->
          <span style="mso-text-raise:12pt;">${label}</span>
          <!--[if mso]><i style="mso-font-width:400%;">&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>`;
}

// ── Section divider ──────────────────────────────────────────────
function divider(): string {
  return `<hr style="border:0;border-top:1px solid ${C.divider};margin:24px 0;">`;
}

// ── Unsubscribe footer block (CAN-SPAM / GDPR compliant) ────────
function unsubscribeBlock(email: string): string {
  const unsubUrl = `${BRAND.siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:16px;">
    <tr>
      <td style="padding-top:16px;border-top:1px solid ${C.divider};">
        <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
          You're receiving this because you subscribed at <a href="${BRAND.siteUrl}" style="color:${C.linkColor};text-decoration:none;">${BRAND.siteUrl}</a>.
        </p>
        <p style="margin:0;font-size:12px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
          <a href="${unsubUrl}" style="color:${C.linkColor};text-decoration:underline;">Unsubscribe</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:${BRAND.supportEmail}" style="color:${C.linkColor};text-decoration:none;">Preferences</a>
        </p>
      </td>
    </tr>
  </table>`;
}


// ══════════════════════════════════════════════════════════════════
//  TEMPLATE 1: Confirmation Email (Double Opt-In)
// ══════════════════════════════════════════════════════════════════
export function confirmEmail(email: string, token: string): { html: string; text: string; subject: string } {
  const confirmUrl = `${BRAND.siteUrl}/api/confirm?token=${token}`;
  const html = baseHtml(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${C.textPrimary};font-family:'Nunito',sans-serif;letter-spacing:-0.02em;">
      Confirm Your Subscription
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${C.textBody};font-family:'Nunito',sans-serif;">
      Welcome! You're one step away from receiving updates about new posts on
      <strong style="color:${C.textPrimary};">security engineering, Rust, eBPF, DevSecOps</strong>, and more from the TechAnV blog.
    </p>
    ${ctaButton(confirmUrl, 'Confirm Subscription')}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${C.textMuted};font-family:'Nunito',sans-serif;">
      Or copy and paste this link into your browser:<br>
      <a href="${confirmUrl}" style="color:${C.linkColor};word-break:break-all;font-size:12px;">${confirmUrl}</a>
    </p>
    ${divider()}
    <p style="margin:0;font-size:12px;line-height:1.5;color:${C.textFooter};font-family:'Nunito',sans-serif;">
      If you didn't subscribe with <strong>${email}</strong>, you can safely ignore this email. No action will be taken.
    </p>
  `, 'Confirm your subscription to TechAnV Blog');

  const text = `TechAnV Blog — Confirm Your Subscription

Welcome! You're one step away from receiving updates about security engineering, Rust, eBPF, DevSecOps, and more.

Confirm your subscription:
${confirmUrl}

If you didn't subscribe, you can safely ignore this email.

---
${BRAND.fullName}
${BRAND.consultingUrl}`;

  return { html, text, subject: 'Confirm your subscription — TechAnV Blog' };
}


// ══════════════════════════════════════════════════════════════════
//  TEMPLATE 2: Welcome Email (sent after confirmation)
// ══════════════════════════════════════════════════════════════════
export function welcomeEmail(email: string): { html: string; text: string; subject: string } {
  const html = baseHtml(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${C.textPrimary};font-family:'Nunito',sans-serif;letter-spacing:-0.02em;">
      You're In! Welcome Aboard.
    </h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${C.textBody};font-family:'Nunito',sans-serif;">
      Thanks for confirming your subscription. You'll now receive email updates whenever a new post goes live on the
      <a href="${BRAND.siteUrl}" style="color:${C.linkColor};text-decoration:none;font-weight:600;">TechAnV Blog</a>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${C.accentLight};border-radius:8px;border:1px solid ${C.divider};">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${C.textPrimary};font-family:'Nunito',sans-serif;">
            What to expect:
          </p>
          <ul style="margin:0;padding:0 0 0 20px;color:${C.textBody};font-size:14px;line-height:1.8;font-family:'Nunito',sans-serif;">
            <li>Deep dives into <strong>XDR/OXDR Platform Architecture</strong></li>
            <li><strong>Rust</strong> and <strong>eBPF</strong> for security tooling</li>
            <li>Cloud-native security, Kubernetes hardening</li>
            <li>Open-source project updates (OpenArmor, Leviathan)</li>
            <li>Industry research and threat intelligence</li>
          </ul>
        </td>
      </tr>
    </table>

    ${ctaButton(BRAND.siteUrl, 'Read the Blog')}

    ${divider()}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${C.textPrimary};font-family:'Nunito',sans-serif;">
            About ${BRAND.fullName}
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:${C.textMuted};font-family:'Nunito',sans-serif;">
            From open-source security with <a href="https://github.com/openarmor" style="color:${C.linkColor};text-decoration:none;">OpenArmor</a>
            to intelligent AI platforms — we build technology that empowers businesses to move faster, safer, and smarter.
            Transparency, integrity, and trust in every engagement.
          </p>
        </td>
      </tr>
    </table>

    ${unsubscribeBlock(email)}
  `, 'Welcome to TechAnV Blog!');

  const text = `TechAnV Blog — Welcome Aboard!

Thanks for confirming your subscription. You'll receive email updates whenever a new post goes live.

What to expect:
- XDR/OXDR Platform Architecture deep dives
- Rust and eBPF for security tooling
- Cloud-native security, Kubernetes hardening
- Open-source project updates (OpenArmor, Leviathan)
- Industry research and threat intelligence

Read the blog: ${BRAND.siteUrl}

---
About ${BRAND.fullName}
From open-source security with OpenArmor to intelligent AI platforms — we build technology that empowers businesses.
${BRAND.consultingUrl}

Unsubscribe: ${BRAND.siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  return { html, text, subject: 'Welcome to TechAnV Blog! 🎉' };
}


// ══════════════════════════════════════════════════════════════════
//  TEMPLATE 3: Broadcast / New Post Notification
// ══════════════════════════════════════════════════════════════════
export function broadcastEmail(
  email: string,
  subject: string,
  htmlBody: string,
  textBody: string,
  postTitle?: string,
  postUrl?: string,
  postExcerpt?: string,
): { html: string; text: string; subject: string } {
  let content: string;

  if (postTitle && postUrl) {
    // New post notification
    content = `
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${C.accent};font-family:'Nunito',sans-serif;">
        New Post
      </p>
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${C.textPrimary};font-family:'Nunito',sans-serif;letter-spacing:-0.02em;line-height:1.3;">
        ${postTitle}
      </h1>
      ${postExcerpt ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${C.textBody};font-family:'Nunito',sans-serif;">${postExcerpt}</p>` : ''}
      ${ctaButton(postUrl, 'Read Full Post')}
      ${htmlBody ? divider() + `<div style="font-size:15px;line-height:1.7;color:${C.textBody};font-family:'Nunito',sans-serif;">${htmlBody}</div>` : ''}`;
  } else {
    // Custom broadcast
    content = `
      <div style="font-size:15px;line-height:1.7;color:${C.textBody};font-family:'Nunito',sans-serif;">
        ${htmlBody}
      </div>`;
  }

  const html = baseHtml(`
    ${content}
    ${unsubscribeBlock(email)}
  `, subject);

  const text = `${subject}

${postTitle ? postTitle + '\n\n' : ''}${postExcerpt ? postExcerpt + '\n\n' : ''}${textBody}

${postUrl ? 'Read more: ' + postUrl + '\n\n' : ''}
---
${BRAND.fullName}
${BRAND.consultingUrl}

Unsubscribe: ${BRAND.siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;

  return { html, text, subject };
}


// ══════════════════════════════════════════════════════════════════
//  BRANDED HTML PAGES (confirm, unsubscribe, expired)
// ══════════════════════════════════════════════════════════════════

function brandedPage(title: string, icon: string, heading: string, body: string, ctaLabel: string, ctaUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — TechAnV Blog</title>
  <style>
    @import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${C.bgOuter};
      color: ${C.textBody};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .card {
      background: ${C.bgCard};
      border: 1px solid ${C.border};
      border-radius: 12px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    }
    .logo { display: block; margin: 0 auto 32px; }
    .icon { font-size: 48px; margin-bottom: 16px; display: block; }
    h1 { font-size: 24px; font-weight: 800; color: ${C.textPrimary}; margin: 0 0 12px; letter-spacing: -0.02em; }
    p { font-size: 15px; line-height: 1.7; color: ${C.textBody}; margin: 0 0 16px; }
    .muted { color: ${C.textMuted}; font-size: 13px; }
    .btn {
      display: inline-block;
      padding: 14px 36px;
      background: ${C.buttonBg};
      color: ${C.buttonText};
      text-decoration: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      margin-top: 8px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.88; }
    .footer { margin-top: 32px; font-size: 11px; color: ${C.textFooter}; }
    .footer a { color: ${C.linkColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <img src="${BRAND.logoUrl}" alt="${BRAND.fullName}" width="120" class="logo" />
    <span class="icon">${icon}</span>
    <h1>${heading}</h1>
    ${body}
    <a href="${ctaUrl}" class="btn">${ctaLabel}</a>
    <p class="footer">
      ${BRAND.fullName} &middot; <a href="${BRAND.consultingUrl}">techanv.com</a> &middot; <a href="${BRAND.siteUrl}">Blog</a>
    </p>
  </div>
</body>
</html>`;
}

export function confirmSuccessPage(siteUrl: string): string {
  return brandedPage(
    'Subscribed!',
    '✅',
    "You're Subscribed!",
    '<p>Welcome aboard! You\'ll now receive updates about new posts from <strong style="color:#1a1410;">TechAnV Blog</strong>.</p>',
    'Start Reading →',
    siteUrl,
  );
}

export function tokenExpiredPage(siteUrl: string): string {
  return brandedPage(
    'Link Expired',
    '⏰',
    'Link Expired',
    '<p>This confirmation link has expired (valid 24 hours).</p><p class="muted">Please subscribe again to get a fresh link.</p>',
    '← Back to Blog',
    siteUrl,
  );
}

export function unsubscribedPage(siteUrl: string, email: string): string {
  return brandedPage(
    'Unsubscribed',
    '👋',
    'Unsubscribed',
    `<p><strong style="color:#1a1410;">${email}</strong> has been removed from our newsletter.</p><p class="muted">You can always resubscribe from the blog sidebar.</p>`,
    '← Back to Blog',
    siteUrl,
  );
}
