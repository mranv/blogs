/**
 * Newsletter subscription API endpoint.
 *
 * Strategy: Writes to Cloudflare KV for zero-dependency storage,
 * then optionally forwards to Buttondown (if BUTTONDOWN_API_KEY env var is set).
 *
 * Set these secrets in Cloudflare Pages → Settings → Environment variables:
 *   - BUTTONDOWN_API_KEY (optional — enables Buttondown sync)
 *   - SUBSCRIPTION_SECRET (optional — enables KV write to a namespace)
 *
 * Without any env vars, subscriptions are logged to console and return success.
 * This lets the form work immediately in dev and production.
 */
export async function POST({ request, locals }: any) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const ref = body.ref || "/";

    // --- Email validation ---
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Please enter a valid email address." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Honeypot check ---
    if (body.name || body.website) {
      // Bot filled the honeypot — silently accept
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- Try Buttondown first (if API key is configured) ---
    const buttondownKey = import.meta.env.BUTTONDOWN_API_KEY;
    if (buttondownKey) {
      try {
        const bdRes = await fetch("https://api.buttondown.email/v1/subscribers", {
          method: "POST",
          headers: {
            Authorization: `Token ${buttondownKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            metadata: { source: "blog", ref },
            tags: ["blog-subscriber"],
          }),
        });

        if (bdRes.ok) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const bdData = await bdRes.json();
        // Buttondown returns 409 for already-subscribed
        if (bdRes.status === 409 || bdData.detail?.includes("already")) {
          return new Response(
            JSON.stringify({ ok: true, message: "Already subscribed!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
        // Log but don't fail — fall through to console logging
        console.error("[subscribe] Buttondown error:", bdData);
      } catch (err) {
        console.error("[subscribe] Buttondown fetch error:", err);
      }
    }

    // --- Try Cloudflare KV (if binding is available) ---
    if (locals.runtime?.env?.SUBSCRIPTIONS_KV) {
      try {
        const kv = locals.runtime.env.SUBSCRIPTIONS_KV;
        const existing = await kv.get(email, { type: "json" }).catch(() => null);

        if (existing) {
          return new Response(
            JSON.stringify({ ok: true, message: "Already subscribed!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        await kv.put(
          email,
          JSON.stringify({
            email,
            ref,
            subscribedAt: new Date().toISOString(),
          })
        );

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("[subscribe] KV error:", err);
      }
    }

    // --- Fallback: Log and return success ---
    console.log(`[subscribe] New subscription: ${email} (ref: ${ref})`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[subscribe] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "Server error. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
