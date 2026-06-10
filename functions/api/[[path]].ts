import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';

// --- BINDING TYPES ---
type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Helper to generate UUIDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper to map D1 User row + Features row into a frontend User object
const mapUserRow = (row: any) => {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    company_name: row.company_name,
    avatar_url: row.avatar_url,
    timezone: row.timezone,
    theme: row.theme,
    plan: row.plan,
    subscription_status: row.subscription_status,
    next_billing_date: row.next_billing_date,
    created_at: row.created_at,
    isAdmin: !!row.is_admin,
    isBlocked: !!row.is_blocked,
    features: {
      socialNetworksLimit: row.social_networks_limit ?? 1,
      schedulingsLimit: row.schedulings_limit ?? 10,
      autoPosting: !!row.auto_posting,
      adsManager: !!row.ads_manager,
      aiOptimization: !!row.ai_optimization,
      geminiIntegration: !!row.gemini_integration,
      exportableReports: !!row.exportable_reports
    }
  };
};

const getDefaultFeaturesForPlan = (plan: string) => {
  switch (plan) {
    case 'free':
      return { socialNetworksLimit: 1, schedulingsLimit: 10, autoPosting: 0, ads_manager: 0, ai_optimization: 0, gemini_integration: 0, exportable_reports: 0 };
    case 'starter':
      return { socialNetworksLimit: 3, schedulingsLimit: 999999, autoPosting: 1, ads_manager: 1, ai_optimization: 1, gemini_integration: 0, exportable_reports: 0 };
    case 'professional':
    default:
      return { socialNetworksLimit: 6, schedulingsLimit: 999999, autoPosting: 1, ads_manager: 1, ai_optimization: 1, gemini_integration: 1, exportable_reports: 1 };
  }
};

// Middleware: Get authenticated user from headers
const getAuthUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const userId = authHeader.split(' ')[1];
  const userRow = await c.env.DB.prepare(`
    SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
    FROM users u
    LEFT JOIN user_features uf ON u.id = uf.user_id
    WHERE u.id = ?
  `).bind(userId).first();

  return mapUserRow(userRow);
};

// --- ROUTES ---

// Servir arquivos do R2 Bucket
app.get('/api/files/:filename', async (c) => {
  const filename = c.req.param('filename');
  const object = await c.env.R2.get(filename);
  if (!object) {
    return c.text('Arquivo não encontrado', 404);
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

// Upload de arquivos para o R2 Bucket
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return c.json({ error: 'Nenhum arquivo enviado' }, 400);
    }
    const ext = file.name.split('.').pop();
    const uniqueName = `file_${uuid().substring(0, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    await c.env.R2.put(uniqueName, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    return c.json({ url: `/api/files/${uniqueName}` });
  } catch (err: any) {
    return c.json({ error: 'Erro no upload: ' + err.message }, 500);
  }
});

// Auth: Login
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const db = c.env.DB;

  // Admin Override
  if (email.toLowerCase() === 'lflimas2022@gmail.com') {
    if (password !== 'Bugs@@959') {
      return c.json({ error: 'Senha incorreta para o administrador.' }, 401);
    }
    let userRow = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email.toLowerCase()).first();
    if (!userRow) {
      const id = 'usr_admin';
      const created_at = new Date().toISOString();
      await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)')
        .bind(id, email.toLowerCase(), 'Luiz Fernando', 'Lima', 'Social SaaS', 'professional', created_at)
        .run();
      const feats = getDefaultFeaturesForPlan('professional');
      await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.ads_manager, feats.ai_optimization, feats.gemini_integration, feats.exportable_reports)
        .run();
      
      userRow = await db.prepare(`
        SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
        FROM users u
        LEFT JOIN user_features uf ON u.id = uf.user_id
        WHERE u.id = ?
      `).bind(id).first();
    } else {
      userRow = await db.prepare(`
        SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
        FROM users u
        LEFT JOIN user_features uf ON u.id = uf.user_id
        WHERE u.id = ?
      `).bind(userRow.id).first();
    }
    return c.json({ user: mapUserRow(userRow) });
  }

  // Regular user lookup
  const userRow = await db.prepare(`
    SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
    FROM users u
    LEFT JOIN user_features uf ON u.id = uf.user_id
    WHERE u.email = ?
  `).bind(email.toLowerCase()).first();

  if (userRow) {
    if (userRow.is_blocked) {
      return c.json({ error: 'Sua conta está bloqueada pelo administrador.' }, 403);
    }
    return c.json({ user: mapUserRow(userRow) });
  }

  // Dynamic user creation (like in React AppContext)
  if (email.includes('@') && password) {
    const id = 'usr_' + uuid().substring(0, 6);
    const firstName = email.split('@')[0];
    const created_at = new Date().toISOString();
    const next_billing = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_billing_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email.toLowerCase(), firstName, '', 'Empresa ' + firstName, 'starter', 'active', next_billing, created_at)
      .run();

    const feats = getDefaultFeaturesForPlan('starter');
    await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.ads_manager, feats.ai_optimization, feats.gemini_integration, feats.exportable_reports)
      .run();

    // Seed default starter accounts/posts for better trial experience
    await db.prepare('INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(uuid(), id, 'instagram', '@' + firstName, 'ig_' + uuid().substring(0, 4), created_at)
      .run();

    const newUserRow = await db.prepare(`
      SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
      FROM users u
      LEFT JOIN user_features uf ON u.id = uf.user_id
      WHERE u.id = ?
    `).bind(id).first();

    return c.json({ user: mapUserRow(newUserRow) });
  }

  return c.json({ error: 'Credenciais incorretas.' }, 401);
});

// Auth: Signup
app.post('/api/auth/signup', async (c) => {
  const { email, password, first_name, last_name, company_name } = await c.req.json();
  const db = c.env.DB;

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) {
    return c.json({ error: 'Este e-mail já está cadastrado.' }, 400);
  }

  const isNewAdmin = email.toLowerCase() === 'lflimas2022@gmail.com';
  const plan = isNewAdmin ? 'professional' : 'starter';
  const id = 'usr_' + uuid().substring(0, 6);
  const created_at = new Date().toISOString();
  const next_billing = isNewAdmin ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_billing_date, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, email.toLowerCase(), first_name, last_name, company_name, plan, 'active', next_billing, isNewAdmin ? 1 : 0, created_at)
    .run();

  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.ads_manager, feats.ai_optimization, feats.gemini_integration, feats.exportable_reports)
    .run();

  // Seed default starter accounts
  await db.prepare('INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(uuid(), id, 'instagram', '@' + first_name, 'ig_' + uuid().substring(0, 4), created_at)
    .run();

  const newUserRow = await db.prepare(`
    SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
    FROM users u
    LEFT JOIN user_features uf ON u.id = uf.user_id
    WHERE u.id = ?
  `).bind(id).first();

  return c.json({ user: mapUserRow(newUserRow) });
});

// Auth: Me profile fetcher
app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  return c.json({ user });
});

// Auth: Update Profile
app.post('/api/auth/update-profile', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const data = await c.req.json();

  const query = `
    UPDATE users 
    SET first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        company_name = COALESCE(?, company_name),
        avatar_url = COALESCE(?, avatar_url),
        timezone = COALESCE(?, timezone),
        theme = COALESCE(?, theme)
    WHERE id = ?
  `;
  await c.env.DB.prepare(query).bind(
    data.first_name ?? null,
    data.last_name ?? null,
    data.company_name ?? null,
    data.avatar_url ?? null,
    data.timezone ?? null,
    data.theme ?? null,
    user.id
  ).run();

  const updatedRow = await c.env.DB.prepare(`
    SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
    FROM users u
    LEFT JOIN user_features uf ON u.id = uf.user_id
    WHERE u.id = ?
  `).bind(user.id).first();

  return c.json({ user: mapUserRow(updatedRow) });
});

// Auth: Update Password
app.post('/api/auth/update-password', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  return c.json({ success: true });
});

// General Data Fetcher (Dashboard view)
app.get('/api/data', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const db = c.env.DB;

  const accounts = await db.prepare('SELECT * FROM connected_accounts WHERE user_id = ?').bind(user.id).all();
  const posts = await db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY scheduled_at DESC').bind(user.id).all();
  const campaigns = await db.prepare('SELECT * FROM campaigns WHERE user_id = ?').bind(user.id).all();
  const automations = await db.prepare('SELECT * FROM automations WHERE user_id = ?').bind(user.id).all();
  const notifications = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
  const auditLogs = await db.prepare('SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all();
  const invoices = await db.prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY date DESC').bind(user.id).all();

  return c.json({
    connectedAccounts: accounts.results.map((acc: any) => ({ ...acc, is_active: !!acc.is_active })),
    posts: posts.results.map((p: any) => ({
      ...p,
      media_urls: JSON.parse(p.media_urls || '[]'),
      platforms: JSON.parse(p.platforms || '[]')
    })),
    campaigns: campaigns.results.map((camp: any) => ({
      ...camp,
      audience_location: JSON.parse(camp.audience_location || '[]')
    })),
    automations: automations.results.map((a: any) => ({ ...a, is_active: !!a.is_active })),
    notifications: notifications.results.map((n: any) => ({ ...n, is_read: !!n.is_read })),
    auditLogs: auditLogs.results.map((l: any) => ({
      ...l,
      old_value: l.old_value ? JSON.parse(l.old_value) : null,
      new_value: l.new_value ? JSON.parse(l.new_value) : null
    })),
    invoices: invoices.results
  });
});

// Posts API Operations
app.post('/api/posts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const data = await c.req.json();
  const id = uuid();
  const created_at = new Date().toISOString();
  const isNow = new Date(data.scheduled_at) <= new Date();
  const status = isNow ? 'published' : 'scheduled';
  const published_at = isNow ? created_at : null;

  await c.env.DB.prepare(`
    INSERT INTO posts (id, user_id, content, media_urls, hashtags, scheduled_at, published_at, platforms, status, preview_text, impressions, reach, likes, comments, shares, saves, clicks, engagement_rate, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    user.id,
    data.content,
    JSON.stringify(data.media_urls || []),
    data.hashtags || '',
    data.scheduled_at,
    published_at,
    JSON.stringify(data.platforms || []),
    status,
    data.preview_text,
    isNow ? Math.floor(Math.random() * 50) + 10 : 0,
    isNow ? Math.floor(Math.random() * 40) + 8 : 0,
    0, 0, 0, 0, 0, 0.0,
    created_at
  ).run();

  // Audit Log
  const auditId = uuid();
  const actionText = isNow ? `Publicou post instantâneo` : `Agendou post para ${new Date(data.scheduled_at).toLocaleString()}`;
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, new_value, created_at)
    VALUES (?, ?, ?, 'post', ?, ?, ?)
  `).bind(
    auditId,
    user.id,
    actionText,
    id,
    JSON.stringify(data),
    created_at
  ).run();

  return c.json({ success: true, id });
});

app.put('/api/posts/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');
  const data = await c.req.json();

  const isNow = data.scheduled_at && new Date(data.scheduled_at) <= new Date();

  await c.env.DB.prepare(`
    UPDATE posts
    SET content = COALESCE(?, content),
        media_urls = COALESCE(?, media_urls),
        hashtags = COALESCE(?, hashtags),
        scheduled_at = COALESCE(?, scheduled_at),
        status = CASE WHEN ? = 1 THEN 'published' ELSE COALESCE(?, status) END,
        published_at = CASE WHEN ? = 1 THEN ? ELSE published_at END
    WHERE id = ? AND user_id = ?
  `).bind(
    data.content ?? null,
    data.media_urls ? JSON.stringify(data.media_urls) : null,
    data.hashtags ?? null,
    data.scheduled_at ?? null,
    isNow ? 1 : 0,
    data.status ?? null,
    isNow ? 1 : 0,
    new Date().toISOString(),
    id,
    user.id
  ).run();

  return c.json({ success: true });
});

app.delete('/api/posts/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM posts WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});

// Campaigns API Operations
app.post('/api/campaigns', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const data = await c.req.json();
  const id = uuid();
  const extId = 'cmp_' + data.platform.substring(0, 2) + '_' + Math.floor(Math.random() * 90000 + 10000);
  const created_at = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO campaigns (id, user_id, name, platform, objective, status, budget, spent, start_date, end_date, audience_age_min, audience_age_max, audience_location, creative_text, creative_image_url, cta_button_text, landing_url, campaign_external_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    user.id,
    data.name,
    data.platform,
    data.objective,
    data.status,
    data.budget,
    data.start_date,
    data.end_date ?? null,
    data.audience_age_min,
    data.audience_age_max,
    JSON.stringify(data.audience_location || []),
    data.creative_text,
    data.creative_image_url ?? null,
    data.cta_button_text,
    data.landing_url,
    extId,
    created_at
  ).run();

  // Audit Log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, new_value, created_at)
    VALUES (?, ?, ?, 'campaign', ?, ?, ?)
  `).bind(
    uuid(),
    user.id,
    `Criou campanha de anúncios "${data.name}" no ${data.platform === 'meta_ads' ? 'Meta Ads' : 'TikTok Ads'}`,
    id,
    JSON.stringify(data),
    created_at
  ).run();

  return c.json({ success: true, id });
});

app.put('/api/campaigns/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');
  const data = await c.req.json();

  // Handle toggling campaign status or updates
  if (data.status) {
    const current = await c.env.DB.prepare('SELECT status, name FROM campaigns WHERE id = ? AND user_id = ?').bind(id, user.id).first();
    if (current) {
      await c.env.DB.prepare('UPDATE campaigns SET status = ? WHERE id = ?').bind(data.status, id).run();
      // Audit Log
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, created_at)
        VALUES (?, ?, ?, 'campaign', ?, ?, ?, ?)
      `).bind(
        uuid(),
        user.id,
        `${data.status === 'active' ? 'Retomou' : 'Pausou'} campanha "${current.name}"`,
        id,
        JSON.stringify({ status: current.status }),
        JSON.stringify({ status: data.status }),
        new Date().toISOString()
      ).run();
      return c.json({ success: true });
    }
  }

  await c.env.DB.prepare(`
    UPDATE campaigns
    SET name = COALESCE(?, name),
        budget = COALESCE(?, budget),
        creative_text = COALESCE(?, creative_text),
        landing_url = COALESCE(?, landing_url)
    WHERE id = ? AND user_id = ?
  `).bind(
    data.name ?? null,
    data.budget ?? null,
    data.creative_text ?? null,
    data.landing_url ?? null,
    id,
    user.id
  ).run();

  return c.json({ success: true });
});

app.delete('/api/campaigns/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});

// Automations API
app.put('/api/automations/:id/toggle', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');

  const current = await c.env.DB.prepare('SELECT is_active, name FROM automations WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (current) {
    const newState = current.is_active ? 0 : 1;
    await c.env.DB.prepare('UPDATE automations SET is_active = ? WHERE id = ?').bind(newState, id).run();
    return c.json({ success: true, is_active: !!newState });
  }
  return c.json({ error: 'Não encontrado' }, 404);
});

// Connected Accounts
app.post('/api/connected-accounts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { platform, accountName } = await c.req.json();
  const id = uuid();
  const created_at = new Date().toISOString();
  const accountId = platform.substring(0, 2) + '_' + Math.floor(Math.random() * 9000 + 1000);

  await c.env.DB.prepare(`
    INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, user.id, platform, accountName, accountId, created_at).run();

  // Audit Log
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
    VALUES (?, ?, ?, 'account', ?, ?)
  `).bind(uuid(), user.id, `Conectou conta do ${platform.toUpperCase()} "${accountName}"`, id, created_at).run();

  return c.json({ success: true, id });
});

app.delete('/api/connected-accounts/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');

  const acc = await c.env.DB.prepare('SELECT * FROM connected_accounts WHERE id = ? AND user_id = ?').bind(id, user.id).first();
  if (acc) {
    await c.env.DB.prepare('DELETE FROM connected_accounts WHERE id = ?').bind(id).run();
    // Audit Log
    await c.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
      VALUES (?, ?, ?, 'account', ?, ?)
    `).bind(uuid(), user.id, `Desconectou conta do ${acc.platform.toUpperCase()} "${acc.account_name}"`, id, new Date().toISOString()).run();
    return c.json({ success: true });
  }
  return c.json({ error: 'Não encontrado' }, 404);
});

// Force Sync Mock Metrics
app.post('/api/connected-accounts/sync', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const db = c.env.DB;

  await db.prepare('UPDATE connected_accounts SET is_active = 1, last_synced = ? WHERE user_id = ?').bind(new Date().toISOString(), user.id).run();
  
  // Drift some published post numbers in database
  const posts = await db.prepare("SELECT id, impressions, reach, likes, comments FROM posts WHERE user_id = ? AND status = 'published'").bind(user.id).all();
  for (const p of posts.results) {
    const newImps = p.impressions + Math.floor(Math.random() * 100) + 10;
    const newReach = p.reach + Math.floor(Math.random() * 80) + 8;
    const newLikes = p.likes + Math.floor(Math.random() * 20);
    const newComments = p.comments + Math.floor(Math.random() * 2);
    await db.prepare('UPDATE posts SET impressions = ?, reach = ?, likes = ?, comments = ? WHERE id = ?').bind(newImps, newReach, newLikes, newComments, p.id).run();
  }

  return c.json({ success: true });
});

// Notifications
app.put('/api/notifications/:id/read', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});

app.post('/api/notifications/read-all', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(user.id).run();
  return c.json({ success: true });
});

app.delete('/api/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  await c.env.DB.prepare('DELETE FROM notifications WHERE user_id = ?').bind(user.id).run();
  return c.json({ success: true });
});

// Asaas billing upgrade
app.post('/api/payments/asaas-upgrade', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { plan, paymentMethod, value } = await c.req.json();
  const db = c.env.DB;

  const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 1. Update user plan
  await db.prepare('UPDATE users SET plan = ?, subscription_status = "active", next_billing_date = ? WHERE id = ?')
    .bind(plan, nextBilling, user.id).run();

  // 2. Update user features
  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('UPDATE user_features SET social_networks_limit = ?, schedulings_limit = ?, auto_posting = ?, ads_manager = ?, ai_optimization = ?, gemini_integration = ?, exportable_reports = ? WHERE user_id = ?')
    .bind(feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.ads_manager, feats.ai_optimization, feats.gemini_integration, feats.exportable_reports, user.id).run();

  // 3. Register invoice
  const invId = '#ASAAS-' + Math.floor(Math.random() * 900000 + 100000);
  await db.prepare('INSERT INTO invoices (id, user_id, date, plan_name, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, "Pago")')
    .bind(invId, user.id, new Date().toLocaleDateString('pt-BR'), plan === 'starter' ? 'Plano Starter' : 'Plano Professional', value, paymentMethod).run();

  // 4. Register Audit Log
  await db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_value, new_value, created_at)
    VALUES (?, ?, ?, 'campaign', ?, ?, ?, ?)
  `).bind(
    uuid(),
    user.id,
    `Upgrade para o ${plan === 'starter' ? 'Plano Starter' : 'Plano Professional'} via Asaas (${paymentMethod.toUpperCase()})`,
    invId,
    JSON.stringify({ plan: user.plan }),
    JSON.stringify({ plan }),
    new Date().toISOString()
  ).run();

  return c.json({ success: true });
});

// Admin Panel operations
app.get('/api/admin/users', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);

  const list = await c.env.DB.prepare(`
    SELECT u.*, uf.social_networks_limit, uf.schedulings_limit, uf.auto_posting, uf.ads_manager, uf.ai_optimization, uf.gemini_integration, uf.exportable_reports
    FROM users u
    LEFT JOIN user_features uf ON u.id = uf.user_id
    WHERE u.is_admin = 0
  `).all();

  return c.json({ users: list.results.map(row => mapUserRow(row)) });
});

app.post('/api/admin/users/create', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const { email, firstName, lastName, companyName, plan } = await c.req.json();
  const db = c.env.DB;

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) {
    return c.json({ error: 'Este e-mail já está cadastrado.' }, 400);
  }

  const id = 'usr_' + uuid().substring(0, 6);
  const created_at = new Date().toISOString();
  const next_billing = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_billing_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, email.toLowerCase(), firstName, lastName, companyName, plan, 'active', next_billing, created_at)
    .run();

  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.ads_manager, feats.ai_optimization, feats.gemini_integration, feats.exportable_reports)
    .run();

  return c.json({ success: true });
});

app.post('/api/admin/users/update-features', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const { userId, plan, features, isBlocked } = await c.req.json();
  const db = c.env.DB;

  await db.prepare('UPDATE users SET plan = ?, is_blocked = ? WHERE id = ?')
    .bind(plan, isBlocked ? 1 : 0, userId).run();

  await db.prepare(`
    UPDATE user_features
    SET social_networks_limit = ?,
        schedulings_limit = ?,
        auto_posting = ?,
        ads_manager = ?,
        ai_optimization = ?,
        gemini_integration = ?,
        exportable_reports = ?
    WHERE user_id = ?
  `).bind(
    features.socialNetworksLimit,
    features.schedulingsLimit,
    features.autoPosting ? 1 : 0,
    features.adsManager ? 1 : 0,
    features.aiOptimization ? 1 : 0,
    features.geminiIntegration ? 1 : 0,
    features.exportableReports ? 1 : 0,
    userId
  ).run();

  return c.json({ success: true });
});

export const onRequest = handle(app);
