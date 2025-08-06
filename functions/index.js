export async function onRequest(context) {
  async fetch(request, env, ctx) {
    const ip = request.headers.get('cf-connecting-ip') || '';
    const ua = request.headers.get('user-agent') || '';

    // 1. Allow only Android + Chrome Mobile
    const isAndroid = /Android/i.test(ua);
    const isChromeMobile = /Chrome\\/\\d+\\.\\d+ Mobile/i.test(ua);
    if (!isAndroid || !isChromeMobile) {
      return new Response("Blocked: Only Android Chrome Mobile allowed", { status: 403 });
    }

    // 2. Cloudflare bot detection
    const isCloudflareBot = request.headers.get('cf-is-bot') === 'true';
    if (isCloudflareBot) {
      return new Response("Blocked: Cloudflare bot detected", { status: 403 });
    }

    // 3. Check VPN/Hosting via ip-api
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting,status`);
    const geoData = await geoRes.json();
    if (geoData?.proxy || geoData?.hosting || geoData?.status !== "success") {
      return new Response("Blocked: VPN/Hosting detected", { status: 403 });
    }

    // 4. IP Rate limit - 2 hits per 48 hours
    const key = `ip:${ip}`;
    const data = await env.ip_tracker.get(key, { type: "json" }) || { count: 0, firstHit: Date.now() };
    const now = Date.now();
    const elapsed = now - data.firstHit;

    if (elapsed > 24 * 3600 * 1000) {
      data.count = 1;
      data.firstHit = now;
    } else {
      data.count += 1;
    }

    await env.ip_tracker.put(key, JSON.stringify(data), { expirationTtl: 48 * 3600 });
    if (data.count > 2) {
      return Response.redirect("https://example.com/redirect-offer", 302);
    }
  }
}