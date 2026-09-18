// popup.js — نسخهٔ ۲.۲: UI جدید + انیمیشن + پرچم‌ها + چندزبانه + مبدل سریع

const I18N = window.__I18N__;
const VER = (chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : "?";

const ratesEl = document.getElementById("rates");
const rateLabel = document.getElementById("rateLabel");
const meta = document.getElementById("meta");
const refreshBtn = document.getElementById("refresh");
const manualRow = document.getElementById("manualRow");
const manualInput = document.getElementById("manualInput");
const setManualBtn = document.getElementById("setManual");
const enabledToggle = document.getElementById("enabledToggle");
const targetSel = document.getElementById("targetSel");
const langSel = document.getElementById("langSel");
const convAmount = document.getElementById("convAmount");
const convFrom = document.getElementById("convFrom");
const convResult = document.getElementById("convResult");
const convSub = document.getElementById("convSub");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const hintBox = document.getElementById("hintBox");
const verPill = document.getElementById("verPill");

verPill.textContent = "v" + VER;

let lang = "en";
let t = I18N.makeT("en");
let LAST = { rate: null, intl: null, settings: { target: "IRT", lang: "auto" } };

const FLAGS = {
  IRT: "🇮🇷", IRR: "🇮🇷", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", CHF: "🇨🇭",
  TRY: "🇹🇷", AED: "🇦🇪", CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", JPY: "🇯🇵",
  CNY: "🇨🇳", KRW: "🇰🇷", SGD: "🇸🇬", HKD: "🇭🇰", TWD: "🇹🇼",
  INR: "🇮🇳", PKR: "🇵🇰", BDT: "🇧🇩", LKR: "🇱🇰", THB: "🇹🇭", MYR: "🇲🇾",
  IDR: "🇮🇩", VND: "🇻🇳", SAR: "🇸🇦", QAR: "🇶🇦", KWD: "🇰🇼", BHD: "🇧🇭",
  OMR: "🇴🇲", JOD: "🇯🇴", ILS: "🇮🇱", EGP: "🇪🇬", MAD: "🇲🇦", TND: "🇹🇳",
  DZD: "🇩🇿", ZAR: "🇿🇦", NGN: "🇳🇬", KES: "🇰🇪", GHS: "🇬🇭",
  RUB: "🇷🇺", UAH: "🇺🇦", PLN: "🇵🇱", CZK: "🇨🇿", HUF: "🇭🇺",
  RON: "🇷🇴", BGN: "🇧🇬", RSD: "🇷🇸", SEK: "🇸🇪", NOK: "🇳🇴",
  DKK: "🇩🇰", ISK: "🇮🇸", MXN: "🇲🇽", BRL: "🇧🇷", ARS: "🇦🇷",
  CLP: "🇨🇱", PEN: "🇵🇪", GEL: "🇬🇪", AZN: "🇦🇿", KZT: "🇰🇿", UZS: "🇺🇿"
};
const flagOf = (code) => FLAGS[code] || "💱";

const GROUPS = [
  { key: "gIran", codes: ["IRT"] },
  { key: "gPopular", codes: ["USD", "EUR", "GBP", "CHF", "TRY", "AED", "CAD", "AUD", "JPY"] },
  { key: "gEurope", codes: ["RON", "BGN", "RSD", "HUF", "PLN", "CZK", "SEK", "NOK", "DKK", "ISK", "UAH", "RUB", "ILS"] },
  { key: "gAsia", codes: ["CNY", "KRW", "INR", "PKR", "BDT", "LKR", "THB", "MYR", "IDR", "VND", "SGD", "HKD", "TWD", "SAR", "QAR", "KWD", "BHD", "OMR", "JOD"] },
  { key: "gAmericas", codes: ["MXN", "BRL", "ARS", "CLP", "PEN", "NZD"] },
  { key: "gAfrica", codes: ["ZAR", "EGP", "NGN", "KES", "GHS", "MAD", "TND", "DZD", "GEL", "AZN", "KZT", "UZS", "IRR"] }
];
const CONV_COMMON = ["USD", "EUR", "GBP", "CHF", "RON", "TRY", "AED", "SAR", "JPY", "CNY", "INR", "PKR", "RUB", "IRR"];
const IRT_LIST = ["USD", "EUR", "GBP", "AED", "TRY", "CAD", "AUD", "JPY", "CNY"];
const INTL_LIST = ["USD", "EUR", "GBP", "CHF", "TRY", "RON", "AED", "SAR", "INR", "JPY"];

// برچسب کوتاه برای سلکت (نام بلند IRT جا را می‌گرفت — عامل بیرون‌زدگی قبلی!)
function shortName(code) {
  return code === "IRT" ? t("irtShort") : I18N.curName(lang, code);
}

// ---------- اعمال زبان روی کل رابط ----------
function applyLang(keepValues) {
  lang = I18N.resolve(LAST.settings && LAST.settings.lang);
  t = I18N.makeT(lang);
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.title = t("extShort");
  titleEl.textContent = t("extShort");
  subtitleEl.textContent = t("subTitle");
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-ph"));
  });
  hintBox.innerHTML = t("hint1") + "<br>" + t("hint2");
  fillTargetSelect(keepValues);
  fillConvFrom(keepValues);
  renderRates();
  renderMeta();
  renderConv();
}

function fillTargetSelect(keep) {
  const prev = keep ? targetSel.value : null;
  targetSel.innerHTML = "";
  GROUPS.forEach((g) => {
    const og = document.createElement("optgroup");
    og.label = t(g.key);
    g.codes.forEach((code) => {
      const o = document.createElement("option");
      o.value = code;
      o.textContent = flagOf(code) + " " + shortName(code) + " (" + code + ")";
      og.appendChild(o);
    });
    targetSel.appendChild(og);
  });
  targetSel.value = prev || (LAST.settings && LAST.settings.target) || "IRT";
}

function fillConvFrom(keep) {
  const prev = keep ? convFrom.value : null;
  convFrom.innerHTML = "";
  CONV_COMMON.forEach((code) => {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = flagOf(code) + " " + shortName(code);
    convFrom.appendChild(o);
  });
  convFrom.value = prev || "EUR";
}

// ---------- لیست نرخ‌ها ----------
function renderRates() {
  const target = (LAST.settings && LAST.settings.target) || "IRT";
  ratesEl.innerHTML = "";

  if (target === "IRT") {
    const r = LAST.rate;
    if (!r || !r.currencies || !Object.keys(r.currencies).length) {
      ratesEl.innerHTML = '<div class="rate-loading">' + t("noRate") + "</div>";
      rateLabel.textContent = t("perUnitToman");
      return;
    }
    const c = r.currencies;
    IRT_LIST.forEach((code) => {
      if (c[code] == null) return;
      const row = document.createElement("div");
      row.className = "rate-row";
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = flagOf(code) + " " + I18N.curName(lang, code);
      const codeEl = document.createElement("span");
      codeEl.className = "code";
      codeEl.textContent = " " + code;
      name.appendChild(codeEl);
      const val = document.createElement("span");
      val.className = "val";
      val.textContent = I18N.fmtNum(lang, c[code]);
      row.appendChild(name);
      row.appendChild(val);
      ratesEl.appendChild(row);
    });
    rateLabel.textContent = t("perUnitToman");
    return;
  }

  const intl = LAST.intl;
  if (!intl || !intl.rates || !intl.rates[String(target).toLowerCase()]) {
    ratesEl.innerHTML = '<div class="rate-loading">' + t("noIntlRate") + "</div>";
    rateLabel.textContent = "—";
    return;
  }
  const T = intl.rates[String(target).toLowerCase()];
  INTL_LIST.forEach((code) => {
    if (code === target) return;
    const r = intl.rates[code.toLowerCase()];
    if (!r) return;
    const row = document.createElement("div");
    row.className = "rate-row";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = flagOf(code) + " " + I18N.curName(lang, code) + " → " + flagOf(target);
    const val = document.createElement("span");
    val.className = "val";
    val.textContent = I18N.fmtNum(lang, T / r, null, 4);
    row.appendChild(name);
    row.appendChild(val);
    ratesEl.appendChild(row);
  });
  rateLabel.textContent = t("perUnitTarget", { t: I18N.curName(lang, target) });
}

function renderMeta() {
  const target = (LAST.settings && LAST.settings.target) || "IRT";
  const timeStr = (ms) => {
    try { return new Date(ms).toLocaleTimeString(lang === "fa" ? "fa-IR" : undefined); }
    catch (e) { return ""; }
  };
  if (target === "IRT") {
    const r = LAST.rate;
    if (r) {
      const src = r.source === "manual" ? t("manual") : "TGJU";
      meta.textContent = t("source", { s: src }) + " • " + t("updated", { t: timeStr(r.updatedAt) });
    } else {
      meta.textContent = t("noRate");
    }
  } else {
    const intl = LAST.intl;
    if (intl) {
      meta.textContent = t("source", { s: intl.source }) + " • " +
        I18N.curName(lang, target) + " • " + t("updated", { t: timeStr(intl.updatedAt) });
    } else {
      meta.textContent = t("noIntlRate");
    }
  }
  syncManualRow();
  syncBeams();
}

// ---------- مبدل سریع ----------
function renderConv() {
  const target = (LAST.settings && LAST.settings.target) || "IRT";
  const amt = parseFloat(String(convAmount.value).replace(/[,\s]/g, ""));
  const from = convFrom.value;

  if (!isFinite(amt) || amt <= 0) {
    convResult.textContent = "—";
    convSub.textContent = "";
    return;
  }

  let v = null, sub = "";
  if (target === "IRT") {
    const c = LAST.rate && LAST.rate.currencies;
    if (c && c[from]) {
      v = amt * c[from];
      sub = t("source", { s: "TGJU" });
    } else if (LAST.intl && LAST.intl.rates && c && c.USD && LAST.intl.rates[from.toLowerCase()]) {
      v = (amt / LAST.intl.rates[from.toLowerCase()]) * c.USD;
      sub = t("source", { s: "cross USD" });
    }
    if (v != null) convResult.textContent = I18N.fmtNum(lang, Math.round(v)) + " " + t("tomanWord");
  } else if (LAST.intl && LAST.intl.rates) {
    const rT = LAST.intl.rates[String(target).toLowerCase()];
    const rF = LAST.intl.rates[from.toLowerCase()];
    if (rT && rF) {
      v = amt * (rT / rF);
      sub = t("source", { s: LAST.intl.source });
      convResult.textContent = I18N.fmtNum(lang, v, 2, 4) + " " + target;
    }
  }
  if (v == null) {
    convResult.textContent = "—";
  } else {
    // پالس نتیجه
    convResult.classList.remove("pop");
    void convResult.offsetWidth;
    convResult.classList.add("pop");
  }
  convSub.textContent = sub || "";
}

function syncManualRow() {
  manualRow.style.display = ((LAST.settings && LAST.settings.target) || "IRT") === "IRT" ? "flex" : "none";
}

/* beam با کلید روشن/خاموش: خاموش = نور می‌ایستد */
function syncBeams() {
  var off = !enabledToggle.checked;
  document.querySelectorAll(".beam").forEach(function (el) {
    el.classList.toggle("paused", off);
  });
}

// ---------- بارگذاری ----------
function load(forceRefresh) {
  meta.textContent = t("loading");
  refreshBtn.classList.add("loading");
  chrome.runtime.sendMessage({ type: "GET_RATE", forceRefresh: !!forceRefresh }, (response) => {
    refreshBtn.classList.remove("loading");
    if (chrome.runtime.lastError) {
      meta.textContent = t("commError");
      return;
    }
    if (response) {
      LAST.rate = response.rate || null;
      LAST.intl = response.intl || null;
      LAST.settings = response.settings || { target: "IRT", lang: "auto" };
      enabledToggle.checked = response.enabled !== false;
      langSel.value = (LAST.settings && LAST.settings.lang) || "auto";
    }
    applyLang(true);
  });
}

// ---------- رویدادها ----------
enabledToggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: enabledToggle.checked });
  syncBeams();
});

targetSel.addEventListener("change", () => {
  chrome.storage.local.get("settings", (v) => {
    const st = Object.assign({}, v.settings, { target: targetSel.value });
    chrome.storage.local.set({ settings: st });
    LAST.settings = st;
    renderRates();
    renderMeta();
    renderConv();
  });
});

langSel.addEventListener("change", () => {
  chrome.storage.local.get("settings", (v) => {
    const st = Object.assign({}, v.settings, { lang: langSel.value });
    chrome.storage.local.set({ settings: st });
    LAST.settings = st;
    applyLang(true); // بدون رفرش، همهٔ رابط عوض می‌شود
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.usdTomanRate) LAST.rate = changes.usdTomanRate.newValue;
  if (changes.intlRate) LAST.intl = changes.intlRate.newValue;
  if (changes.settings) LAST.settings = changes.settings.newValue;
  applyLang(true);
});

refreshBtn.addEventListener("click", () => load(true));

setManualBtn.addEventListener("click", () => {
  const val = parseInt(manualInput.value, 10);
  if (!val || val < 1000) {
    manualInput.style.borderColor = "#dc2626";
    return;
  }
  chrome.runtime.sendMessage({ type: "SET_MANUAL_RATE", toman: val }, (response) => {
    if (response && response.rate) {
      LAST.rate = response.rate;
      renderRates();
      renderMeta();
      renderConv();
      manualInput.value = "";
      manualInput.style.borderColor = "rgba(148,163,184,.2)";
    }
  });
});

convAmount.addEventListener("input", renderConv);
convFrom.addEventListener("change", renderConv);

load();
