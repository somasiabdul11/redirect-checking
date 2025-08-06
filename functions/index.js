export async function onRequest(context) {

  // 1. Allow only Android + Chrome Mobile
  const isAndroid = /Android/i.test(ua);
  const isChromeMobile = /Chrome\\/\\d+\\.\\d+ Mobile/i.test(ua);
  if (!isAndroid || !isChromeMobile) {
    return new Response("Blocked: Only Android Chrome Mobile allowed", { status: 403 });
  }

  const ip = context.request.headers.get("CF-Connecting-IP") || "8.8.8.8";
  const res = await fetch(`http://ip-api.com/json/${ip}`);
  const data = await res.json();

  if (data.proxy === true || data.hosting === true || data.mobile === true) {
    return new Response("Access Denied: Proxy/VPN/Hosting detected.", { status: 403 });
  }

  const html = `
    <html>
      <head>
        <title>IP Info</title>
        <script>
          if (window !== window.top) {
            window.top.location = window.location.href;
          }

          const adLimit = 3;
          let views = localStorage.getItem('adViews');
          views = views ? parseInt(views) : 0;
          if (views >= adLimit) {
            document.addEventListener('DOMContentLoaded', () => {
              document.body.innerHTML = "<h2>Thank you for visiting. You've reached the ad view limit.</h2>";
            });
          } else {
            localStorage.setItem('adViews', views + 1);
            setTimeout(() => {
              const ad = document.getElementById('ad-container');
              if (ad) ad.style.display = 'block';
            }, 5000);
          }
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
    headers: { 'content-type': 'text/html' }
  });
}