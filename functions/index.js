export async function onRequest(context) {
  const request = context.request;
  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("cf-connecting-ip");
  const env = context.env;

  // 1. Allow only Android Chrome Mobile
  const isAndroid = /Android/i.test(ua);
  const isChromeMobile = /Chrome\/\d+\.\d+ Mobile/i.test(ua);
  
  // if (!isAndroid || !isChromeMobile) {
  //   return new Response("Blocked: Only Android Chrome Mobile allowed", { status: 403 });
  // }

  // 2. Block Cloudflare-detected bots
  const isBot = request.headers.get("cf-is-bot") === "true";
  if (isBot) {
    return new Response("Blocked: Bot detected", { status: 403 });
  }

  // 3. Fetch from ip-api.com
  const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,mobile`);
  const data = await geoRes.json();

  if (data.status !== "success" || data.proxy  || data.hosting || data.mobile) {
    return new Response("Access Denied: Proxy/VPN/Hosting detected.", { status: 403 });
  }

  // 4. HTML Response
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>IP Info</title>
      <script>
        // Block iframe
        if (window !== window.top) {
          // window.top.location = window.location.href;
          document.addEventListener('DOMContentLoaded', function () {
            document.body.innerHTML = "<h2>iframe</h2>";
          });
        }

        // Headless detection
        const isHeadless = navigator.webdriver || !navigator.plugins.length || !navigator.languages.length;
        if (isHeadless) {
          // window.location.href = "https://google.com";
          document.body.innerHTML = "<h2>Access denied. Headless browser not allowed.</h2>";
        }

        // Ad frequency control
        // Rate limiting with localStorage (2x in 48 hours)
        const now = Date.now();
        const maxViews = 2;
        const limitHours = 24;

        let record = localStorage.getItem("accessRecord");
        record = record ? JSON.parse(record) : { count: 0, firstTime: now };

        const elapsed = now - record.firstTime;

        if (elapsed > limitHours * 3600 * 1000) {
          record.count = 1;
          record.firstTime = now;
        } else {
          record.count += 1;
        }

        localStorage.setItem("accessRecord", JSON.stringify(record));

        if (record.count > maxViews) {
          // window.location.href = "https://google.com/";
          document.addEventListener('DOMContentLoaded', function () {
            document.body.innerHTML = "<h2>Access denied. Maximum.</h2>";
            });
        } else {
          setTimeout(() => {
            window.location.href = "https://abc.com";
          }, 200); // delay untuk validasi
        }
      </script>
    </head>
    <body></body>
    </html>
  `;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=UTF-8" }
  });
}
