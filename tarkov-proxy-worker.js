// Cloudflare Worker: прокси к api.tarkov.dev/graphql с CORS-заголовками.
// Деплой: dash.cloudflare.com -> Workers & Pages -> Create Worker ->
// вставить этот код вместо шаблонного -> Deploy.
// Получите URL вида https://ваш-worker.ваш-логин.workers.dev — его и
// прописываем в index.html вместо прямого адреса api.tarkov.dev.

const UPSTREAM = "https://api.tarkov.dev/graphql";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // Preflight-запрос браузера — отвечаем сразу, не ходя никуда дальше.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = UPSTREAM + url.search; // прокидываем ?query=...&variables=... как есть

    const init = {
      method: request.method,
      headers: { "Content-Type": "application/json" },
    };
    if (request.method === "POST") {
      init.body = await request.text();
    }

    try {
      const upstreamResponse = await fetch(targetUrl, init);
      const body = await upstreamResponse.text();
      return new Response(body, {
        status: upstreamResponse.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (err) {
      return new Response(JSON.stringify({ errors: [{ message: "Proxy fetch failed: " + err.message }] }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
