// background.js — سرویس‌ورکر اکستنشن (نسخهٔ ۲ — بین‌المللی)
// وظایف:
//  ۱) حالت تومان: نرخ ۹ ارز اصلی را از TGJU (بازار آزاد ایران) می‌گیرد.
//  ۲) حالت جهانی: جدول «هر ارز به دلار» را از APIهای رایگان بین‌المللی می‌گیرد
//     (با دو منبع پشتیبان) تا تبدیلِ هر ارزی به هر ارزی ممکن شود — مثلاً لئو رومانی → یورو.
//  ۳) کش + آلارم ۱۰ دقیقه‌ای + پاسخ به content script و popup.

const CACHE_KEY = "usdTomanRate"; // { currencies:{USD,EUR,…}, source, updatedAt }
const INTL_KEY = "intlRate";      // { rates:{usd:1, eur:0.87, ron:4.56,…}, source, updatedAt }
const SETTINGS_KEY = "settings";  // { target:"IRT" | "USD" | "EUR" | "RON" | … }
const ENABLED_KEY = "enabled";
const REFRESH_MINUTES = 10;       // تومان: هر ۱۰ دقیقه
const INTL_TTL_MIN = 180;         // نرخ‌های جهانی روزانه‌اند؛ ۳ ساعت کش کافی است

// ---------- حالت تومان (TGJU) ----------
// منبع «جدول» api.tgju.org قابل‌اعتماد است و برای هر ارز جداگانه کار می‌کند.
const TABLE_BASE = "https://api.tgju.org/v1/market/indicator/summary-table-data/";

const CURRENCY_KEYS = {
  USD: "price_dollar_rl",
  EUR: "price_eur",
  GBP: "price_gbp",
  AED: "price_aed",
  TRY: "price_try",
  CAD: "price_cad",
  AUD: "price_aud",
  JPY: "price_jpy",
  CNY: "price_cny"
};

// برخی ارزها در tgju برای چند واحد قیمت‌گذاری می‌شوند؛ ین ژاپن قیمتِ هر «۱۰۰ ین» است.
const CURRENCY_UNIT = { JPY: 100 };

// ---------- حالت جهانی ----------
// هر سه منبع یک جدول می‌دهند: «چقدر از هر ارز، به ازای ۱ دلار». فقط شکل JSON شان فرق دارد.
const INTL_SOURCES = [
  {
    name: "exchangerate-api",
    url: "https://open.er-api.com/v6/latest/USD",
    pick: (j) => j && j.rates // کلیدها UPPERCASE
  },
  {
    name: "currency-api (pages.dev)",
    url: "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
    pick: (j) => j && j.usd // کلیدها lowercase
  },
  {
    name: "currency-api (jsdelivr)",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    pick: (j) => j && j.usd
  }
];

function toNumber(value) {
  if (value === null || value === undefined) return NaN;
  const cleaned = String(value).replace(/[,\s]/g, "").replace(/[^\d.]/g, "");
  return parseFloat(cleaned);
}

// خروجی tgju به ریال است → تقسیم بر ۱۰ برای تومان، و بر تعدادِ واحد (ین: ۱۰۰).
function toToman(rial, code) {
  return Math.round(rial / 10 / (CURRENCY_UNIT[code] || 1));
}

async function fetchOne(code) {
  const res = await fetch(TABLE_BASE + CURRENCY_KEYS[code], { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  // data.data آرایه‌ای نزولی از روزهاست؛ ردیف اول جدیدترین است.
  // فرمت هر ردیف: [close, low, high, open, change, pct, gdate, jdate]
  const rial = toNumber(data && data.data && data.data[0] && data.data[0][0]);
  return rial && rial > 0 ? toToman(rial, code) : null;
}

async function fetchRate() {
  const stored = (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY];
  const merged = Object.assign({}, stored && stored.currencies);

  const codes = Object.keys(CURRENCY_KEYS);
  const results = await Promise.all(
    codes.map(async (code) => {
      try {
        return [code, await fetchOne(code)];
      } catch (err) {
        console.warn(`[UniversalCurrency] ارز ${code} ناموفق:`, err);
        return [code, null];
      }
    })
  );

  for (const [code, toman] of results) {
    if (toman) merged[code] = toman;
  }

  // اگر حتی دلار هم به‌دست نیامد، نسخه‌ی قدیمی را نگه دار.
  if (!merged.USD || merged.USD < 1000) return stored || null;

  const payload = { currencies: merged, source: "tgju", updatedAt: Date.now() };
  await chrome.storage.local.set({ [CACHE_KEY]: payload });
  return payload;
}

// جدول جهانی: { eur: 0.87, ron: 4.56, … } — یعنی «چقدر ارز، به ازای ۱ دلار»
async function fetchIntl(forceRefresh = false) {
  const stored = (await chrome.storage.local.get(INTL_KEY))[INTL_KEY];
  const isFresh = stored && Date.now() - stored.updatedAt < INTL_TTL_MIN * 60 * 1000;
  if (stored && isFresh && !forceRefresh) return stored;

  for (const src of INTL_SOURCES) {
    try {
      const res = await fetch(src.url, { cache: "no-store" });
      if (!res.ok) continue;
      const raw = src.pick(await res.json());
      if (!raw) continue;
      const rates = {};
      for (const k of Object.keys(raw)) {
        const v = Number(raw[k]);
        if (isFinite(v) && v > 0) rates[k.toLowerCase()] = v;
      }
      // جدول سالم باید حداقل این‌ها را داشته باشد
      if (!rates.usd || !rates.eur || !rates.ron) continue;
      const payload = { rates: rates, source: src.name, updatedAt: Date.now() };
      await chrome.storage.local.set({ [INTL_KEY]: payload });
      return payload;
    } catch (err) {
      console.warn("[UniversalCurrency] منبع جهانی ناموفق:", src.name, err);
    }
  }
  return stored || null; // هیچ‌کدام نشد؛ نسخهٔ کش‌شده
}

async function getRate(forceRefresh = false) {
  const stored = (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY];
  const isFresh = stored && Date.now() - stored.updatedAt < REFRESH_MINUTES * 60 * 1000;
  if (stored && isFresh && !forceRefresh) return stored;
  const fresh = await fetchRate();
  if (fresh) return fresh;
  return stored || null;
}

async function getEnabled() {
  const v = (await chrome.storage.local.get(ENABLED_KEY))[ENABLED_KEY];
  return v !== false; // پیش‌فرض: روشن
}

async function getSettings() {
  const v = (await chrome.storage.local.get(SETTINGS_KEY))[SETTINGS_KEY];
  return Object.assign({ target: "IRT", lang: "auto" }, v || {});
}

// ---------- آلارم‌ها ----------
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("refreshRate", { periodInMinutes: REFRESH_MINUTES });
  fetchRate();
  fetchIntl(true);
});
chrome.runtime.onStartup.addListener(() => {
  fetchRate();
  fetchIntl(false);
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refreshRate") {
    fetchRate();
    fetchIntl(false);
  }
});

// ---------- پیام‌ها ----------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "GET_RATE") {
    Promise.all([
      getRate(message.forceRefresh),
      fetchIntl(message.forceRefresh),
      getEnabled(),
      getSettings()
    ]).then(([rate, intl, enabled, settings]) =>
      sendResponse({ rate: rate, intl: intl, enabled: enabled, settings: settings })
    );
    return true; // async response
  }
  if (message && message.type === "SET_MANUAL_RATE") {
    (async () => {
      const stored = (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY];
      const currencies = Object.assign({}, stored && stored.currencies);
      currencies.USD = message.toman; // ورودی دستی همان تومان است (فقط دلار)
      const payload = { currencies: currencies, source: "manual", updatedAt: Date.now() };
      await chrome.storage.local.set({ [CACHE_KEY]: payload });
      sendResponse({ rate: payload });
    })();
    return true;
  }
  if (message && message.type === "GET_INTL_NOW") {
    fetchIntl(true).then((p) => sendResponse({ intl: p }));
    return true;
  }
});
