export async function onRequest(context) {
  const ip = context.request.headers.get("CF-Connecting-IP") || "8.8.8.8";
  const res = await fetch(`http://ip-api.com/json/${ip}`);
  const data = await res.json();

  return new Response(
    `<h1>IP: ${ip}</h1><pre>${JSON.stringify(data, null, 2)}</pre>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}