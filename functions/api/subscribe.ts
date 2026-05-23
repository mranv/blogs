// Cloudflare Pages Function — /api/subscribe
// Handles newsletter subscriptions via Buttondown API
// Supports: Buttondown (default), ConvertKit, Mailchimp, Resend

interface SubscribeRequest {
  email: string;
  ref?: string; // referrer/source
}

// RFC 5322 compliant email regex (practical subset)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email address is required.' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email address is too long.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  // Block common disposable domains (optional privacy measure)
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', 'guerrillamail.com',
    'mailinator.com', 'yopmail.com', 'sharklasers.com',
  ];
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, error: 'Disposable email addresses are not accepted.' };
  }

  return { valid: true };
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

// ── Buttondown ──────────────────────────────────────────────────
async function subscribeButtondown(
  email: string,
  apiKey: string,
  ref?: string
): Promise<{ success: boolean; error?: string }> {
  const body: Record<string, string> = { email };
  if (ref) body.metadata = JSON.stringify({ source: ref });

  const res = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return { success: true };

  const err = await res.json().catch(() => ({}));
  const msg =
    (err as any).detail ??
    (err as any).email?.[0] ??
    (err as any).non_field_errors?.[0] ??
    'Subscription failed.';

  // Already subscribed is not an error for the user
  if (typeof msg === 'string' && msg.toLowerCase().includes('already')) {
    return { success: true };
  }

  return { success: false, error: String(msg) };
}

// ── ConvertKit ──────────────────────────────────────────────────
async function subscribeConvertKit(
  email: string,
  apiKey: string,
  formId: string,
  _ref?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(
    `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        email,
      }),
    }
  );

  if (res.ok) return { success: true };

  const err = await res.json().catch(() => ({}));
  return {
    success: false,
    error: (err as any).message ?? (err as any).error ?? 'Subscription failed.',
  };
}

// ── Mailchimp ───────────────────────────────────────────────────
async function subscribeMailchimp(
  email: string,
  apiKey: string,
  listId: string,
  serverPrefix: string,
  _ref?: string
): Promise<{ success: boolean; error?: string }> {
  // Mailchimp API keys end with the server prefix, e.g. "abc123-us21"
  const subscriberHash = await crypto.subtle
    .digest('MD5', new TextEncoder().encode(email.toLowerCase()))
    .then((buf) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    )
    .catch(() => '');

  // Fallback: if MD5 not available, use upsert with email
  const res = await fetch(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'pending', // double opt-in
      }),
    }
  );

  if (res.ok || res.status === 400) {
    const body = await res.json().catch(() => ({}));
    // Mailchimp returns 400 for existing subscribers with title "Member Exists"
    if ((body as any).title === 'Member Exists') return { success: true };
    if (res.ok) return { success: true };
    return { success: false, error: (body as any).detail ?? 'Subscription failed.' };
  }

  const err = await res.json().catch(() => ({}));
  return {
    success: false,
    error: (err as any).detail ?? 'Subscription failed.',
  };
}

// ── Resend (simple: just store via Resend Audience API) ─────────
async function subscribeResend(
  email: string,
  apiKey: string,
  audienceId: string,
  _ref?: string
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('https://api.resend.com/audiences/' + audienceId + '/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (res.ok || res.status === 409) return { success: true }; // 409 = already exists

  const err = await res.json().catch(() => ({}));
  return {
    success: false,
    error: (err as any).message ?? 'Subscription failed.',
  };
}

// ── Main handler ────────────────────────────────────────────────
export const onRequestPost: PagesFunction = async (context) => {
  const env = context.env as Record<string, string | undefined>;

  // Read which provider to use (default: buttondown)
  const provider = (env.NEWSLETTER_PROVIDER ?? 'buttondown').toLowerCase();

  let body: SubscribeRequest;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400);
  }

  const { email: rawEmail, ref } = body;

  // Validate email
  const { valid, error: validationError } = validateEmail(rawEmail);
  if (!valid) {
    return jsonResponse({ ok: false, error: validationError }, 422);
  }

  const email = rawEmail.trim().toLowerCase();

  // Dispatch to the chosen provider
  let result: { success: boolean; error?: string };

  switch (provider) {
    case 'buttondown': {
      const apiKey = env.BUTTONDOWN_API_KEY;
      if (!apiKey) {
        console.error('BUTTONDOWN_API_KEY is not set');
        return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
      }
      result = await subscribeButtondown(email, apiKey, ref);
      break;
    }

    case 'convertkit': {
      const apiKey = env.CONVERTKIT_API_KEY;
      const formId = env.CONVERTKIT_FORM_ID;
      if (!apiKey || !formId) {
        console.error('CONVERTKIT_API_KEY or CONVERTKIT_FORM_ID not set');
        return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
      }
      result = await subscribeConvertKit(email, apiKey, formId, ref);
      break;
    }

    case 'mailchimp': {
      const apiKey = env.MAILCHIMP_API_KEY;
      const listId = env.MAILCHIMP_LIST_ID;
      // Server prefix is the part after the dash in the API key, e.g. "us21"
      const serverPrefix = apiKey?.split('-').pop();
      if (!apiKey || !listId || !serverPrefix) {
        console.error('MAILCHIMP_API_KEY or MAILCHIMP_LIST_ID not set');
        return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
      }
      result = await subscribeMailchimp(email, apiKey, listId, serverPrefix, ref);
      break;
    }

    case 'resend': {
      const apiKey = env.RESEND_API_KEY;
      const audienceId = env.RESEND_AUDIENCE_ID;
      if (!apiKey || !audienceId) {
        console.error('RESEND_API_KEY or RESEND_AUDIENCE_ID not set');
        return jsonResponse({ ok: false, error: 'Server misconfiguration.' }, 500);
      }
      result = await subscribeResend(email, apiKey, audienceId, ref);
      break;
    }

    default:
      return jsonResponse(
        { ok: false, error: `Unknown provider "${provider}".` },
        500
      );
  }

  if (!result.success) {
    return jsonResponse({ ok: false, error: result.error }, 502);
  }

  return jsonResponse({
    ok: true,
    message: 'Successfully subscribed! Check your inbox to confirm.',
  });
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
};
