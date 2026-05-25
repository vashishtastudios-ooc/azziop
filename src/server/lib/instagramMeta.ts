type MetaFetchOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  accessToken?: string;
  body?: URLSearchParams;
};

const GRAPH_BASE = 'https://graph.facebook.com/v22.0';

async function metaFetch<T>(path: string, options: MetaFetchOptions = {}): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  if (options.accessToken) {
    url.searchParams.set('access_token', options.accessToken);
  }
  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
    body: options.body?.toString(),
  });

  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok || (json as { error?: unknown }).error) {
    const message =
      (json as { error?: { message?: string } }).error?.message ??
      `Meta Graph API request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

export function buildMetaOAuthUrl(state: string, redirectUri: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error('META_APP_ID is not configured');
  const url = new URL('https://www.facebook.com/v22.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set(
    'scope',
    'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,pages_show_list,pages_manage_posts,business_management',
  );
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeCodeForLongLivedToken(code: string, redirectUri: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID / META_APP_SECRET are not configured');
  }

  const short = await metaFetch<{ access_token: string }>(
    `/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`,
  );

  const long = await metaFetch<{ access_token: string; expires_in: number }>(
    `/oauth/access_token?grant_type=fb_exchange_token&client_id=${encodeURIComponent(
      appId,
    )}&client_secret=${encodeURIComponent(appSecret)}&fb_exchange_token=${encodeURIComponent(
      short.access_token,
    )}`,
  );

  return long;
}

export async function getInstagramBusinessAccount(accessToken: string) {
  const pages = await metaFetch<{ data: Array<{ id: string; name?: string }> }>(
    '/me/accounts',
    { accessToken },
  );

  for (const page of pages.data) {
    const detail = await metaFetch<{
      instagram_business_account?: { id: string };
    }>(`/${page.id}?fields=instagram_business_account`, { accessToken });
    if (detail.instagram_business_account?.id) {
      const igUser = await metaFetch<{ username?: string }>(
        `/${detail.instagram_business_account.id}?fields=username`,
        { accessToken },
      );
      return {
        pageId: page.id,
        igUserId: detail.instagram_business_account.id,
        username: igUser.username ?? null,
      };
    }
  }

  throw new Error('No Instagram business account found on your connected Facebook pages');
}

export async function getPageAccessToken(userAccessToken: string, pageId: string): Promise<string> {
  const page = await metaFetch<{ access_token: string }>(
    `/${pageId}?fields=access_token`,
    { accessToken: userAccessToken },
  );
  return page.access_token;
}

export async function publishFacebookPost(input: {
  userAccessToken: string;
  pageId: string;
  imageUrl: string;
  caption: string;
}): Promise<string> {
  const pageToken = await getPageAccessToken(input.userAccessToken, input.pageId);

  const body = new URLSearchParams();
  body.set('url', input.imageUrl);
  body.set('caption', input.caption);
  body.set('access_token', pageToken);

  const result = await metaFetch<{ id: string; post_id?: string }>(
    `/${input.pageId}/photos`,
    { method: 'POST', body },
  );

  return result.post_id ?? result.id;
}

export async function publishInstagramImage(input: {
  accessToken: string;
  igUserId: string;
  imageUrl: string;
  caption: string;
}) {
  const createBody = new URLSearchParams();
  createBody.set('image_url', input.imageUrl);
  createBody.set('caption', input.caption);
  createBody.set('access_token', input.accessToken);

  const created = await metaFetch<{ id: string }>(`/${input.igUserId}/media`, {
    method: 'POST',
    body: createBody,
  });

  const publishBody = new URLSearchParams();
  publishBody.set('creation_id', created.id);
  publishBody.set('access_token', input.accessToken);

  const published = await metaFetch<{ id: string }>(`/${input.igUserId}/media_publish`, {
    method: 'POST',
    body: publishBody,
  });

  return published.id;
}
