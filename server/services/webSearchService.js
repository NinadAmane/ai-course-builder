const https = require('https');

function getHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}
function isPdf(url) {
  try { return new URL(url).pathname.toLowerCase().endsWith('.pdf'); } catch { return false; }
}

function scoreResource(r, query) {
  const title = (r.title || '').toLowerCase();
  const url = (r.url || '').toLowerCase();
  const source = (r.source || '').toLowerCase();
  const snippet = (r.snippet || '').toLowerCase();
  const qTokens = Array.from(new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4)));
  let s = 0;
  for (const t of qTokens) {
    if (title.includes(t)) s += 3; // title matches matter most
    if (url.includes(t)) s += 1;
    if (snippet.includes(t)) s += 1; // reward context mentions
  }
  // Prefer deeper content pages over bare homepages
  try {
    const u = new URL(r.url || '');
    const pathDepth = (u.pathname || '/').split('/').filter(Boolean).length;
    if (pathDepth >= 2) s += 1; // likely an article or doc page
    if (pathDepth === 0 || u.pathname === '/' ) s -= 2; // generic homepage
  } catch {}

  const boosts = [
    'docs','developer','dev','learn','tutorial','guide','handbook','manual','spec',
    'wikipedia.org','arxiv.org','acm.org','ieee.org','mozilla.org','python.org','pytorch.org',
    'tensorflow.org','scikit-learn.org','khanacademy.org','mit.edu','stanford.edu','harvard.edu','coursera.org',
    'geeksforgeeks.org','oracle.com','docs.oracle.com','baeldung.com','w3schools.com','tutorialspoint.com',
    'freecodecamp.org','stackoverflow.com','medium.com','towardsdatascience.com','huggingface.co','learn.microsoft.com',
    'cloud.google.com','aws.amazon.com','azure.microsoft.com','paperswithcode.com','kaggle.com','pandas.pydata.org','numpy.org','plotly.com'
  ];
  for (const b of boosts) if (source.includes(b) || url.includes(b)) s += 3;
  if (isPdf(r.url)) s += 2;
  const deny = ['lyrics','song','piano','music','asmr','memes','wallpaper'];
  for (const d of deny) if (title.includes(d) || url.includes(d)) s -= 4;
  return s;
}

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');
}

function normalizeDdgUrl(href) {
  try {
    if (!href) return '';
    href = decodeHtmlEntities(href);
    let urlObj;
    if (/^https?:\/\//i.test(href)) urlObj = new URL(href);
    else if (href.startsWith('/')) urlObj = new URL(`https://duckduckgo.com${href}`);
    if (urlObj && urlObj.hostname.replace(/^www\./,'') === 'duckduckgo.com') {
      const p = urlObj.pathname;
      if (p.startsWith('/l/')) { const v = urlObj.searchParams.get('uddg'); if (v) { const d = decodeURIComponent(v); if (/^https?:\/\//i.test(d)) return d; } return ''; }
      if (p === '/r.js') { const v = urlObj.searchParams.get('u'); if (v) { const d = decodeURIComponent(v); if (/^https?:\/\//i.test(d)) return d; } return ''; }
      return '';
    }
    if (urlObj) return urlObj.toString();
    return '';
  } catch { return ''; }
}

function normalizeFinalUrl(urlStr) {
  try {
    if (!urlStr) return '';
    const u = new URL(urlStr);
    if (u.protocol === 'http:') u.protocol = 'https:';
    for (const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid','rut']) u.searchParams.delete(k);
    return u.toString();
  } catch { return ''; }
}

function sanitizeResources(items = []) {
  const out = [];
  for (const it of items || []) {
    const title = decodeHtmlEntities(it.title || '');
    const from = it.url || '';
    let url = from;
    if (getHost(from) === 'duckduckgo.com' || from.startsWith('/')) url = normalizeDdgUrl(from);
    url = decodeHtmlEntities(url);
    if (!url) continue;
    const host = getHost(url);
    if (!host || host === 'duckduckgo.com') continue;
    url = normalizeFinalUrl(url);
    if (!url) continue;
    out.push({ title: title.slice(0,160), url, source: host, snippet: it.snippet || '' });
  }
  return out;
}

function getJson(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    if (typeof fetch === 'function') {
      fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Safari/537.36' } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(resolve).catch(reject); return;
    }
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); res.resume(); return; }
      let data=''; res.setEncoding('utf8'); res.on('data', c => data+=c); res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject); req.setTimeout(timeoutMs, () => req.destroy(new Error('Timeout')));
  });
}

function getText(url, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    if (typeof fetch === 'function') {
      fetch(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
        .then(resolve).catch(reject); return;
    }
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); res.resume(); return; }
      let data=''; res.setEncoding('utf8'); res.on('data', c => data+=c); res.on('end', () => resolve(data));
    });
    req.on('error', reject); req.setTimeout(timeoutMs, () => req.destroy(new Error('Timeout')));
  });
}

function mapInstantAnswerResults(data) {
  const out = [];
  if (Array.isArray(data?.Results)) {
    for (const r of data.Results) if (r && r.FirstURL && r.Text) out.push({ title: decodeHtmlEntities(r.Text.split(' - ')[0].slice(0,160)), url: r.FirstURL, source: getHost(r.FirstURL), snippet: r.Text.slice(0,300) });
  }
  (function flatten(list){ for (const item of list || []) { if (item.Topics) flatten(item.Topics); else if (item.FirstURL && item.Text) out.push({ title: decodeHtmlEntities(item.Text.split(' - ')[0].slice(0,160)), url: item.FirstURL, source: getHost(item.FirstURL), snippet: item.Text.slice(0,300) }); } })(data?.RelatedTopics);
  return out;
}

function parseDuckDuckGoHtml(html) {
  const results = [];
  const linkRe1 = /<a[^>]+class=["']?result__a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const linkRe2 = /<a[^>]+class=["'][^"']*result__title[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m; const push = (href, inner) => { const title = decodeHtmlEntities((inner||'').replace(/<[^>]+>/g,'').trim()); const url = normalizeDdgUrl(href); if (!url || !title) return; const host = getHost(url); if (!host || host.includes('duckduckgo.com')) return; results.push({ title: title.slice(0,160), url, source: host, snippet: '' }); };
  while ((m = linkRe1.exec(html)) !== null) push(m[1], m[2]);
  while ((m = linkRe2.exec(html)) !== null) push(m[1], m[2]);
  return results;
}

function parseDuckDuckGoLiteHtml(html) {
  const results = [];
  const re = /<a[^>]+class=["'][^"']*result-link[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m; while ((m = re.exec(html)) !== null) {
    const url = normalizeDdgUrl(m[1]); const title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g,'').trim());
    if (!url || !title) continue; const host = getHost(url); if (!host || host.includes('duckduckgo.com')) continue; results.push({ title: title.slice(0,160), url, source: host, snippet: '' });
  }
  return results;
}

async function ddgQuery(rawQuery) {
  const qIA = `${rawQuery} tutorial guide documentation pdf -lyrics -piano -music`;
  const iaUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(qIA)}&format=json&no_html=1&skip_disambig=1`;
  try {
    const data = await getJson(iaUrl); const ia = mapInstantAnswerResults(data); if (ia.length > 0) { console.log('[webSearch][IA]', rawQuery, '->', ia.length); return ia; }
  } catch {}
  const qHTML = `${rawQuery} tutorial guide documentation pdf`;
  try {
    const html = await getText(`https://duckduckgo.com/html/?q=${encodeURIComponent(qHTML)}&kl=us-en`);
    const parsed = parseDuckDuckGoHtml(html);
    if (parsed.length > 0) { console.log('[webSearch][HTML]', rawQuery, '->', parsed.length); return parsed; }
  } catch {}
  try {
    const lite = await getText(`https://duckduckgo.com/lite/?q=${encodeURIComponent(qHTML)}&kl=us-en`);
    const parsedLite = parseDuckDuckGoLiteHtml(lite);
    if (parsedLite.length > 0) { console.log('[webSearch][LITE]', rawQuery, '->', parsedLite.length); }
    return parsedLite;
  } catch {}
  console.log('[webSearch][EMPTY]', rawQuery);
  return [];
}

function curatedFallback(query) {
  const q = query.trim();
  const qEnc = encodeURIComponent(q);
  const qDash = encodeURIComponent(q.replace(/\s+/g, '+'));
  const tag = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)[0] || 'programming';
  return [
    { title: 'Wikipedia Search', url: `https://en.wikipedia.org/w/index.php?search=${qEnc}`, source: 'wikipedia.org', snippet: '' },
    { title: 'GeeksforGeeks Search', url: `https://www.geeksforgeeks.org/?s=${qEnc}`, source: 'geeksforgeeks.org', snippet: '' },
    { title: 'freeCodeCamp Guide Search', url: `https://www.freecodecamp.org/news/search/?query=${qEnc}`, source: 'freecodecamp.org', snippet: '' },
    { title: 'Tutorialspoint Search', url: `https://www.tutorialspoint.com/search/${qDash}`, source: 'tutorialspoint.com', snippet: '' },
    { title: 'Stack Overflow Search', url: `https://stackoverflow.com/search?q=${qEnc}`, source: 'stackoverflow.com', snippet: '' },
    { title: 'Kaggle Search', url: `https://www.kaggle.com/search?q=${qEnc}`, source: 'kaggle.com', snippet: '' },
    { title: 'scikit-learn Docs Search', url: `https://www.google.com/search?q=site%3Ascikit-learn.org+${qEnc}`, source: 'scikit-learn.org', snippet: '' },
    { title: 'MDN Search', url: `https://developer.mozilla.org/en-US/search?q=${qEnc}`, source: 'developer.mozilla.org', snippet: '' },
  ];
}

async function searchResources(query, limit = 8) {
  // Wider, but curated set of trusted domains for relevance
  const domains = [
    'geeksforgeeks.org','wikipedia.org','tutorialspoint.com','freecodecamp.org','stackoverflow.com','oracle.com','docs.oracle.com','baeldung.com',
    'w3schools.com','learn.microsoft.com','developer.mozilla.org','huggingface.co','pytorch.org','tensorflow.org','scikit-learn.org',
    'kaggle.com','pandas.pydata.org','numpy.org','plotly.com','arxiv.org','mit.edu','stanford.edu','harvard.edu','coursera.org',
  ];

  // Query variants improve recall and relevance on DDG
  const variants = [
    query,
    `${query} overview`,
    `${query} basics`,
    `${query} tutorial`,
    `${query} guide`,
    `${query} best practices`,
    `${query} examples`,
    `${query} cheatsheet`,
    `${query} pdf`,
    `${query} 2024`,
    `${query} 2025`,
    `${query} site:edu`,
    `${query} site:org`,
  ];

  const baseQueries = [...variants];
  for (const d of domains) baseQueries.push(`${query} site:${d}`);

  const collected = [];
  const seen = new Set();
  const maxConcurrency = 4;
  let idx = 0;
  const startedAt = Date.now();
  const overallBudgetMs = 12000; // allow a bit more time for better coverage

  function addResults(items) {
    const cleaned = sanitizeResources(items);
    for (const it of cleaned) {
      if (!seen.has(it.url)) { collected.push(it); seen.add(it.url); }
    }
  }

  async function worker() {
    while (idx < baseQueries.length && collected.length < Math.max(limit, 8)) {
      if (Date.now() - startedAt > overallBudgetMs) break;
      const i = idx++;
      let got = [];
      try { got = await ddgQuery(baseQueries[i]); } catch {}
      if (got.length) addResults(got);
    }
  }

  const workers = Array.from({ length: Math.min(maxConcurrency, baseQueries.length) }, () => worker());
  await Promise.race([
    Promise.allSettled(workers),
    new Promise((resolve) => setTimeout(resolve, overallBudgetMs + 500)),
  ]);

  if (collected.length === 0) {
    const fb = curatedFallback(query);
    console.log('[webSearch][FALLBACK]', query, '->', fb.length);
    return fb.slice(0, limit);
  }

  const scored = collected.map(r => ({ r, s: scoreResource(r, query) }))
                         .sort((a,b) => b.s - a.s)
                         .map(({r}) => r);
  // If we still have fewer than requested, append curated fallbacks to fill
  if (scored.length < limit) {
    const fb = sanitizeResources(curatedFallback(query));
    for (const it of fb) {
      if (!scored.find((x) => x.url === it.url)) scored.push(it);
      if (scored.length >= limit) break;
    }
  }
  return scored.slice(0, limit);
}

module.exports = { searchResources, sanitizeResources };
