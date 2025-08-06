export async function onRequest(context) {
  const request = context.request;
  const ua = request.headers.get("user-agent") || "";
  const ip = request.headers.get("cf-connecting-ip") || "8.8.8.8";

  // 1. Allow only Android Chrome Mobile
  // const isAndroid = /Android/i.test(ua);
  // const isChromeMobile = /Chrome\/\d+\.\d+ Mobile/i.test(ua);
  
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

  if (data.status !== "success" || data.proxy || data.hosting || data.mobile) {
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
          window.top.location = window.location.href;
        }

        // Ad frequency control
        const adLimit = 3;
        let views = localStorage.getItem('adViews');
        views = views ? parseInt(views) : 0;

        document.addEventListener('DOMContentLoaded', () => {
          if (views >= adLimit) {
            document.body.innerHTML = "<h2>Thank you for visiting. You've reached the ad view limit.</h2>";
          } else {
            localStorage.setItem('adViews', views + 1);
            setTimeout(() => {
              const ad = document.getElementById('ad-container');
              if (ad) ad.style.display = 'block';
            }, 5000);
          }
        });
      </script>
    </head>
    <body>
      <h1>IP: ${ip}</h1>
      <div id="ad-container" style="display:none;">
        <h2>[Your Ad Here]</h2>
      </div>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=UTF-8" }
  });
}
