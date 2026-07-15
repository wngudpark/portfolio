// ---------------------------------------------------------------------------
// GitHub OAuth proxy for Decap CMS — Cloudflare Worker (module syntax).
//
// GitHub Pages is static and cannot keep an OAuth client secret, so Decap's
// `github` backend needs this small proxy to exchange the login code for an
// access token. Deploy it, then set `base_url` in admin/config.yml to this
// Worker's URL.
//
// Required environment variables (Cloudflare → Worker → Settings → Variables):
//   GITHUB_CLIENT_ID       your GitHub OAuth App "Client ID"      (plaintext var)
//   GITHUB_CLIENT_SECRET   your GitHub OAuth App "Client secret"  (encrypted secret)
//
// GitHub OAuth App "Authorization callback URL" must be:
//   https://<this-worker-host>/callback
// ---------------------------------------------------------------------------

const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1 — Decap opens `${base_url}/auth`; redirect the popup to GitHub.
    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        scope: url.searchParams.get('scope') || 'repo',
        state: crypto.randomUUID()
      });
      return Response.redirect(`${GITHUB_AUTHORIZE}?${params}`, 302);
    }

    // Step 2 — GitHub redirects back with `?code=…`; swap it for a token and
    // hand the token to the CMS window via postMessage.
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing "code" query parameter.', { status: 400 });

      const tokenRes = await fetch(GITHUB_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'decap-cms-oauth-proxy'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      const data = await tokenRes.json();

      const ok = !data.error && data.access_token;
      const status = ok ? 'success' : 'error';
      const content = ok
        ? { token: data.access_token, provider: 'github' }
        : { error: data.error_description || data.error || 'OAuth failed' };

      // Decap handshake: announce, wait for the opener, then post the result.
      const message = `authorization:github:${status}:${JSON.stringify(content)}`;
      const html = `<!doctype html><html><body><script>
        (function () {
          function receiveMessage(e) {
            window.opener.postMessage(${JSON.stringify(message)}, e.origin);
            window.removeEventListener('message', receiveMessage, false);
          }
          window.addEventListener('message', receiveMessage, false);
          window.opener.postMessage('authorizing:github', '*');
        })();
      </script></body></html>`;

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Health check / anything else.
    return new Response('Decap CMS OAuth proxy. Use /auth to begin.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
