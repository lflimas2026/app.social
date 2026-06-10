import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { AsaasService } from './services/AsaasService';
import { PLANS, getDefaultFeaturesForPlan } from './plans-config';

// --- BINDING TYPES ---
type Bindings = {
  DB: D1Database;
  R2: R2Bucket;
  ASAAS_API_KEY: string;
  ASAAS_BASE_URL: string;
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
    subscription_id: row.subscription_id,
    asaas_customer_id: row.asaas_customer_id,
    payment_status: row.payment_status,
    last_payment_date: row.last_payment_date,
    next_due_date: row.next_due_date,
    created_at: row.created_at,
    isAdmin: !!row.is_admin,
    isBlocked: !!row.is_blocked,
      mustChangePassword: !!row.must_change_password,
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

  if (!userRow) return null;

  // Assegurar a criação do cliente no Asaas caso não exista no banco
  if (!userRow.asaas_customer_id) {
    const apiKey = c.env.ASAAS_API_KEY;
    const baseUrl = c.env.ASAAS_BASE_URL;
    if (apiKey && baseUrl) {
      try {
        console.log(`[getAuthUser] Criando cliente no Asaas para ${userRow.email}...`);
        const customer = await AsaasService.createCustomer(apiKey, baseUrl, {
          name: `${userRow.first_name} ${userRow.last_name}`.trim() || userRow.email.split('@')[0],
          email: userRow.email,
          externalReference: userRow.id
        });
        await c.env.DB.prepare('UPDATE users SET asaas_customer_id = ? WHERE id = ?')
          .bind(customer.id, userRow.id).run();
        userRow.asaas_customer_id = customer.id;
      } catch (err: any) {
        console.error('[getAuthUser] Erro ao sincronizar cliente com Asaas:', err.message);
      }
    }
  }

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
        .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.adsManager, feats.aiOptimization, feats.geminiIntegration, feats.exportableReports)
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

    await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, email.toLowerCase(), firstName, '', 'Empresa ' + firstName, 'starter', 'active', next_billing, created_at)
      .run();

    const feats = getDefaultFeaturesForPlan('starter');
    await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.adsManager, feats.aiOptimization, feats.geminiIntegration, feats.exportableReports)
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

  await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_due_date, is_admin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, email.toLowerCase(), first_name, last_name, company_name, plan, 'active', next_billing, isNewAdmin ? 1 : 0, created_at)
    .run();

  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting, feats.adsManager, feats.aiOptimization, feats.geminiIntegration, feats.exportableReports)
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
    connectedAccounts: accounts.results.map((acc: any) => ({ ...acc, is_active: !!acc.is_active, config: acc.config ? JSON.parse(acc.config) : null })),
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
  const { platform, accountName, config } = await c.req.json();
  const id = uuid();
  const created_at = new Date().toISOString();
  const accountId = platform.substring(0, 2) + '_' + Math.floor(Math.random() * 9000 + 1000);

  await c.env.DB.prepare(`
    INSERT INTO connected_accounts (id, user_id, platform, account_name, account_id, config, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.id, platform, accountName, accountId, config ? JSON.stringify(config) : null, created_at).run();

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

// Asaas billing upgrade (Simulated for fallback/testing)
app.post('/api/payments/asaas-upgrade', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { plan, paymentMethod, value } = await c.req.json();
  const db = c.env.DB;

  const nextDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const created_at = new Date().toISOString();

  // 1. Update user plan
  await db.prepare('UPDATE users SET plan = ?, subscription_status = "active", payment_status = "paid", next_due_date = ?, last_payment_date = ? WHERE id = ?')
    .bind(plan, nextDue, created_at.split('T')[0], user.id).run();

  // 2. Update user features
  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('UPDATE user_features SET social_networks_limit = ?, schedulings_limit = ?, auto_posting = ?, ads_manager = ?, ai_optimization = ?, gemini_integration = ?, exportable_reports = ? WHERE user_id = ?')
    .bind(feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting ? 1 : 0, feats.adsManager ? 1 : 0, feats.aiOptimization ? 1 : 0, feats.geminiIntegration ? 1 : 0, feats.exportableReports ? 1 : 0, user.id).run();

  // 3. Register payment & subscription
  const subId = uuid();
  await db.prepare(`
    INSERT INTO subscriptions (id, user_id, asaas_subscription_id, plan_name, billing_type, amount, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `).bind(subId, user.id, 'sub_simulated_' + uuid().substring(0, 6), plan === 'starter' ? 'Plano Starter' : 'Plano Professional', paymentMethod.toUpperCase(), value, created_at, created_at).run();

  const payId = uuid();
  await db.prepare(`
    INSERT INTO payments (id, user_id, asaas_payment_id, subscription_id, amount, billing_type, status, paid_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?)
  `).bind(payId, user.id, 'pay_simulated_' + uuid().substring(0, 6), subId, value, paymentMethod.toUpperCase(), created_at.split('T')[0], created_at, created_at).run();

  // 4. Register invoice
  const invId = '#ASAAS-' + Math.floor(Math.random() * 900000 + 100000);
  await db.prepare('INSERT INTO invoices (id, user_id, date, plan_name, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, "Pago")')
    .bind(invId, user.id, new Date().toLocaleDateString('pt-BR'), plan === 'starter' ? 'Plano Starter' : 'Plano Professional', value, paymentMethod).run();

  return c.json({ success: true });
});

// Asaas Webhook receiver (New Standardized Webhook)
app.post('/api/webhooks/asaas', async (c) => {
  try {
    const payload = await c.req.json();
    const db = c.env.DB;
    const { event, payment, subscription } = payload;
    
    const eventId = uuid();
    const created_at = new Date().toISOString();
    
    // Log every event
    await db.prepare('INSERT INTO asaas_webhook_events (id, event_type, payload, created_at) VALUES (?, ?, ?, ?)')
      .bind(eventId, event || 'UNKNOWN', JSON.stringify(payload), created_at).run();

    const userId = payment?.externalReference || subscription?.externalReference;

    if (userId) {
      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        const amount = payment.value;
        const billingType = payment.billingType;
        
        let planId = 'free';
        let planName = 'Plano Free';
        if (amount >= 499) {
          planId = 'enterprise';
          planName = 'Plano Enterprise';
        } else if (amount >= 149) {
          planId = 'professional';
          planName = 'Plano Professional';
        } else if (amount >= 99) {
          planId = 'starter';
          planName = 'Plano Starter';
        }

        const paidAt = payment.confirmedDate || new Date().toISOString().split('T')[0];
        const nextDue = payment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await db.prepare(`
          UPDATE users 
          SET plan = ?, 
              subscription_status = 'active', 
              payment_status = 'paid', 
              last_payment_date = ?, 
              next_due_date = ?, 
              subscription_id = COALESCE(?, subscription_id)
          WHERE id = ?
        `).bind(planId, paidAt, nextDue, payment.subscription || null, userId).run();

        const feats = getDefaultFeaturesForPlan(planId);
        await db.prepare(`
          UPDATE user_features 
          SET social_networks_limit = ?, schedulings_limit = ?, auto_posting = ?, ads_manager = ?, ai_optimization = ?, gemini_integration = ?, exportable_reports = ? 
          WHERE user_id = ?
        `).bind(feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting ? 1 : 0, feats.adsManager ? 1 : 0, feats.aiOptimization ? 1 : 0, feats.geminiIntegration ? 1 : 0, feats.exportableReports ? 1 : 0, userId).run();

        const existingPay = await db.prepare('SELECT id FROM payments WHERE asaas_payment_id = ?').bind(payment.id).first();
        if (existingPay) {
          await db.prepare('UPDATE payments SET status = "CONFIRMED", paid_at = ?, updated_at = ? WHERE id = ?')
            .bind(paidAt, created_at, existingPay.id).run();
        } else {
          const payId = uuid();
          await db.prepare(`
            INSERT INTO payments (id, user_id, asaas_payment_id, amount, billing_type, status, paid_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?, ?, ?)
          `).bind(payId, userId, payment.id, amount, billingType, paidAt, created_at, created_at).run();
        }

        const invId = '#ASAAS-' + payment.id;
        await db.prepare('INSERT INTO invoices (id, user_id, date, plan_name, amount, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, "Pago")')
          .bind(invId, userId, new Date().toLocaleDateString('pt-BR'), planName, amount, billingType.toLowerCase()).run();

        await db.prepare(`
          INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at)
          VALUES (?, ?, ?, 'campaign', ?, ?)
        `).bind(uuid(), userId, `Pagamento recebido Asaas - Plano ${planName} ativado`, payment.id, created_at).run();

      } else if (event === 'PAYMENT_OVERDUE') {
        await db.prepare('UPDATE users SET payment_status = "overdue", subscription_status = "past_due" WHERE id = ?')
          .bind(userId).run();

        await db.prepare('UPDATE payments SET status = "OVERDUE", updated_at = ? WHERE asaas_payment_id = ?')
          .bind(created_at, payment.id).run();

        await db.prepare('INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (?, ?, "low_performance", "Assinatura Atrasada", "Seu último pagamento está em atraso. Regularize para reativar recursos.", 0, ?)')
          .bind(uuid(), userId, created_at).run();

      } else if (event === 'SUBSCRIPTION_CREATED') {
        const existingSub = await db.prepare('SELECT id FROM subscriptions WHERE asaas_subscription_id = ?').bind(subscription.id).first();
        if (!existingSub) {
          const subId = uuid();
          await db.prepare(`
            INSERT INTO subscriptions (id, user_id, asaas_subscription_id, plan_name, billing_type, amount, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
          `).bind(subId, userId, subscription.id, subscription.value >= 149 ? 'Plano Professional' : 'Plano Starter', subscription.billingType, subscription.value, created_at, created_at).run();
        }
      } else if (event === 'SUBSCRIPTION_DELETED') {
        await db.prepare('UPDATE subscriptions SET status = "DELETED", updated_at = ? WHERE asaas_subscription_id = ?')
          .bind(created_at, subscription.id).run();
        await db.prepare('UPDATE users SET subscription_status = "expired", plan = "free" WHERE id = ?')
          .bind(userId).run();

        const feats = getDefaultFeaturesForPlan('free');
        await db.prepare(`
          UPDATE user_features 
          SET social_networks_limit = ?, schedulings_limit = ?, auto_posting = ?, ads_manager = ?, ai_optimization = ?, gemini_integration = ?, exportable_reports = ? 
          WHERE user_id = ?
        `).bind(feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting ? 1 : 0, feats.adsManager ? 1 : 0, feats.aiOptimization ? 1 : 0, feats.geminiIntegration ? 1 : 0, feats.exportableReports ? 1 : 0, userId).run();
      }
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Erro no Webhook Asaas:', err);
    return c.json({ error: 'Erro interno: ' + err.message }, 500);
  }
});

// Legacy handler mapping
app.post('/api/payments/asaas-webhook', async (c) => {
  return c.json({ error: 'Endpoint migrado para /api/webhooks/asaas' }, 404);
});

// PIX Generation
app.post('/api/payments/pix', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { plan_id } = await c.req.json();
  const db = c.env.DB;
  const apiKey = c.env.ASAAS_API_KEY;
  const baseUrl = c.env.ASAAS_BASE_URL;

  const plan = PLANS[plan_id.toLowerCase()];
  if (!plan) return c.json({ error: 'Plano inválido' }, 400);

  try {
    const customerId = user.asaas_customer_id;
    if (!customerId) return c.json({ error: 'Asaas Customer ID não encontrado. Faça login novamente.' }, 400);

    const result = await AsaasService.createPixPayment(apiKey, baseUrl, {
      customer: customerId,
      billingType: 'PIX',
      value: plan.price,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      externalReference: user.id,
      description: `Upgrade para ${plan.name}`
    });

    const paymentId = uuid();
    const created_at = new Date().toISOString();

    await db.prepare(`
      INSERT INTO payments (id, user_id, asaas_payment_id, amount, billing_type, status, pix_copy_paste, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'PIX', 'PENDING', ?, ?, ?)
    `).bind(paymentId, user.id, result.payment.id, plan.price, result.pixCopyPaste, created_at, created_at).run();

    return c.json({
      payment_id: paymentId,
      qr_code: result.qrCode,
      pix_copy_paste: result.pixCopyPaste,
      expiration_date: result.payment.dueDate
    });
  } catch (err: any) {
    console.error('[POST /api/payments/pix] Erro:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// Credit Card Generation
app.post('/api/payments/card', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { plan_id } = await c.req.json();
  const db = c.env.DB;
  const apiKey = c.env.ASAAS_API_KEY;
  const baseUrl = c.env.ASAAS_BASE_URL;

  const plan = PLANS[plan_id.toLowerCase()];
  if (!plan) return c.json({ error: 'Plano inválido' }, 400);

  try {
    const customerId = user.asaas_customer_id;
    if (!customerId) return c.json({ error: 'Asaas Customer ID não encontrado.' }, 400);

    const result = await AsaasService.createCreditCardPayment(apiKey, baseUrl, {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: plan.price,
      dueDate: new Date().toISOString().split('T')[0],
      externalReference: user.id,
      description: `Upgrade para ${plan.name}`
    });

    const paymentId = uuid();
    const created_at = new Date().toISOString();

    await db.prepare(`
      INSERT INTO payments (id, user_id, asaas_payment_id, amount, billing_type, status, invoice_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'CREDIT_CARD', 'PENDING', ?, ?, ?)
    `).bind(paymentId, user.id, result.id, plan.price, result.invoiceUrl || result.bankSlipUrl, created_at, created_at).run();

    return c.json({
      payment_id: paymentId,
      invoiceUrl: result.invoiceUrl || result.bankSlipUrl
    });
  } catch (err: any) {
    console.error('[POST /api/payments/card] Erro:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// Create subscription
app.post('/api/subscriptions', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const { plan_id, billing_type } = await c.req.json();
  const db = c.env.DB;
  const apiKey = c.env.ASAAS_API_KEY;
  const baseUrl = c.env.ASAAS_BASE_URL;

  const plan = PLANS[plan_id.toLowerCase()];
  if (!plan) return c.json({ error: 'Plano inválido' }, 400);

  try {
    const customerId = user.asaas_customer_id;
    if (!customerId) return c.json({ error: 'Asaas Customer ID não encontrado.' }, 400);

    const nextDue = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await AsaasService.createSubscription(apiKey, baseUrl, {
      customer: customerId,
      billingType: billing_type || 'PIX',
      value: plan.price,
      nextDueDate: nextDue,
      cycle: 'MONTHLY',
      externalReference: user.id,
      description: `Assinatura recorrente ${plan.name}`
    });

    const subId = uuid();
    const created_at = new Date().toISOString();

    await db.prepare(`
      INSERT INTO subscriptions (id, user_id, asaas_subscription_id, plan_name, billing_type, amount, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).bind(subId, user.id, result.id, plan.name, billing_type || 'PIX', plan.price, created_at, created_at).run();

    await db.prepare('UPDATE users SET subscription_id = ?, plan = ?, subscription_status = "active", next_due_date = ? WHERE id = ?')
      .bind(result.id, plan_id, nextDue, user.id).run();

    const feats = getDefaultFeaturesForPlan(plan_id);
    await db.prepare(`
      UPDATE user_features 
      SET social_networks_limit = ?, schedulings_limit = ?, auto_posting = ?, ads_manager = ?, ai_optimization = ?, gemini_integration = ?, exportable_reports = ? 
      WHERE user_id = ?
    `).bind(feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting ? 1 : 0, feats.adsManager ? 1 : 0, feats.aiOptimization ? 1 : 0, feats.geminiIntegration ? 1 : 0, feats.exportableReports ? 1 : 0, user.id).run();

    return c.json({
      success: true,
      subscription_id: subId,
      asaas_subscription_id: result.id
    });
  } catch (err: any) {
    console.error('[POST /api/subscriptions] Erro:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

// Cancel subscription
app.delete('/api/subscriptions', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Não autorizado' }, 401);
  const db = c.env.DB;
  const apiKey = c.env.ASAAS_API_KEY;
  const baseUrl = c.env.ASAAS_BASE_URL;

  try {
    const sub = await db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = "ACTIVE"').bind(user.id).first();
    if (!sub || !sub.asaas_subscription_id) {
      return c.json({ error: 'Assinatura ativa não encontrada' }, 404);
    }

    await AsaasService.cancelSubscription(apiKey, baseUrl, sub.asaas_subscription_id);

    const updated_at = new Date().toISOString();
    await db.prepare('UPDATE subscriptions SET status = "CANCELED", updated_at = ? WHERE id = ?')
      .bind(updated_at, sub.id).run();

    await db.prepare('UPDATE users SET subscription_status = "canceled" WHERE id = ?')
      .bind(user.id).run();

    return c.json({ success: true, message: 'Assinatura cancelada com sucesso.' });
  } catch (err: any) {
    console.error('[DELETE /api/subscriptions] Erro:', err.message);
    return c.json({ error: err.message }, 500);
  }
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

  await db.prepare('INSERT INTO users (id, email, first_name, last_name, company_name, plan, subscription_status, next_due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, email.toLowerCase(), firstName, lastName, companyName, plan, 'active', next_billing, created_at)
    .run();

  const feats = getDefaultFeaturesForPlan(plan);
  await db.prepare('INSERT INTO user_features (user_id, social_networks_limit, schedulings_limit, auto_posting, ads_manager, ai_optimization, gemini_integration, exportable_reports) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, feats.socialNetworksLimit, feats.schedulingsLimit, feats.autoPosting ? 1 : 0, feats.adsManager ? 1 : 0, feats.aiOptimization ? 1 : 0, feats.geminiIntegration ? 1 : 0, feats.exportableReports ? 1 : 0)
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

// Admin: Delete user
app.post('/api/admin/users/delete', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const { userId } = await c.req.json();
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    await c.env.DB.prepare('INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(uuid(), user.id, `Removido usuário ${userId} pelo admin`, 'user', userId, new Date().toISOString()).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Admin: Reset password (generates temporary password and forces change)
app.post('/api/admin/users/reset-password', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const { userId } = await c.req.json();
  const temp = 'tmp_' + Math.random().toString(36).substring(2, 10);
  try {
    await c.env.DB.prepare('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?').bind(temp, userId).run();
    await c.env.DB.prepare('INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(uuid(), user.id, `Resetou senha do usuário ${userId}`, 'user', userId, new Date().toISOString()).run();
    return c.json({ success: true, tempPassword: temp });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Admin: Change user's password (set new one and clear must_change flag)
app.post('/api/admin/users/change-password', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const { userId, newPassword } = await c.req.json();
  try {
    await c.env.DB.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').bind(newPassword, userId).run();
    await c.env.DB.prepare('INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(uuid(), user.id, `Alterou senha do usuário ${userId}`, 'user', userId, new Date().toISOString()).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Admin Financial Metrics
app.get('/api/admin/financial-metrics', async (c) => {
  const user = await getAuthUser(c);
  if (!user || !user.isAdmin) return c.json({ error: 'Não autorizado' }, 401);
  const db = c.env.DB;

  try {
    const totalSubsRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE plan != 'free' AND is_admin = 0").first();
    const totalSubscribers = totalSubsRes?.count || 0;

    const activeSubsRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE plan != 'free' AND subscription_status = 'active' AND is_admin = 0").first();
    const activeSubscribers = activeSubsRes?.count || 0;

    const overdueSubsRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE (payment_status = 'overdue' OR subscription_status = 'past_due') AND is_admin = 0").first();
    const overdueSubscribers = overdueSubsRes?.count || 0;

    const mrrRes = await db.prepare("SELECT SUM(amount) as sum FROM subscriptions WHERE status = 'ACTIVE'").first();
    const mrr = mrrRes?.sum || 0;

    const arr = mrr * 12;

    const cancelledRes = await db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'CANCELED'").first();
    const activeSubQuery = await db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'ACTIVE'").first();
    const cancelledCount = cancelledRes?.count || 0;
    const activeCount = activeSubQuery?.count || 0;
    const totalCount = activeCount + cancelledCount;
    const churnRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;

    const recentPayments = await db.prepare(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.company_name 
      FROM payments p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC 
      LIMIT 10
    `).all();

    return c.json({
      totalSubscribers,
      activeSubscribers,
      overdueSubscribers,
      mrr,
      arr,
      churnRate,
      recentPayments: recentPayments.results
    });
  } catch (err: any) {
    console.error('[GET /api/admin/financial-metrics] Erro:', err.message);
    return c.json({ error: err.message }, 500);
  }
});

export const onRequest = handle(app);
