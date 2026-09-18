// content.js — روی هر صفحه اجرا می‌شود (نسخهٔ ۲ — بین‌المللی).
// قیمت‌های ارزی (دلار، یورو، لئو رومانی، پوند و… ~۶۰ ارز) را در متن صفحه پیدا می‌کند
// و معادلِ «ارز مقصدِ انتخابی» را کنارش نمایش می‌دهد:
//   • مقصد = تومان  → منبع TGJU (بازار آزاد ایران) — دقیقاً مثل نسخهٔ ۱
//   • مقصد = هر ارز دیگر (EUR، RON، TRY و…) → نرخ‌های جهانی بین‌المللی
//
// امکانات:
//  • پشتیبانی از پسوند بزرگی: $1.1K = ۱٬۱۰۰ دلار ، €2.5M ، £3B
//  • کدهای ارز فقط با حروف بزرگ تشخیص داده می‌شوند («Try 5» دیگر قاطی نمی‌شود!)
//  • کلید روشن/خاموش و تغییر ارز مقصد — زنده و بدون رفرش صفحه

(function () {
  "use strict";

  // نسخهٔ اکستنشن — در تولتیپ هر بَج می‌آید تا مطمئن شویم کدام نسخه در حال اجراست
  const VER = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest)
    ? "v" + chrome.runtime.getManifest().version : "";

  const CORE = window.__CUR_CORE__;
  const CUR_REGEX = CORE.CUR_REGEX;
  const resolveCurrency = CORE.resolveCurrency;
  const parseAmount = CORE.parseAmount;
  const applyMag = CORE.applyMag;
  const I18N = window.__I18N__;
  let lang = "en"; // بعداً از تنظیمات پر می‌شود
  let t = I18N.makeT("en");

  // state — از background پر می‌شود
  let state = {
    toman: null,   // { currencies:{USD:2093000,…}, source, updatedAt }
    intl: null,    // { rates:{usd:1, eur:0.87, ron:4.56,…}, source, updatedAt }
    target: "IRT", // "IRT" = تومان ایران؛ یا هر کد ارز جهانی مثل "EUR" / "RON"
    enabled: true
  };

  let observing = false;

  const PROCESSED_ATTR = "data-usd-toman-done";
  const ORIG_ATTR = "data-usd-orig"; // متن اصلی قیمت برای بازگردانی هنگام خاموش‌کردن
  const TAG_CLASS = "usd-toman-tag";
  const WRAP_CLASS = "usd-toman-wrap";

  // ---------- تبدیل ----------
  // خروجی: { v, label, per, note } یا null
  function convert(amount, cur) {
    const target = state.target || "IRT";
    if (target === "IRT") {
      // ۰) ریال ایران: همیشه دقیقاً ÷۱۰ (بدون نیاز به هیچ جدولی)
      if (cur === "IRR") {
        return { v: amount / 10, per: 0.1, label: "IRT", note: " (" + t("rialNote") + ")" };
      }
      // ۱) مسیر دقیق TGJU (۹ ارز اصلی)
      if (state.toman && state.toman.currencies && state.toman.currencies[cur]) {
        const per = state.toman.currencies[cur];
        return { v: amount * per, label: "IRT", per: per, note: "" };
      }
      // ۲) مسیر کراس: ارز → دلار (نرخ جهانی) → تومان (TGJU)
      if (
        state.intl && state.intl.rates && state.toman && state.toman.currencies &&
        state.toman.currencies.USD && state.intl.rates[String(cur).toLowerCase()]
      ) {
        const perUsd = state.intl.rates[String(cur).toLowerCase()];
        const per = (state.toman.currencies.USD / perUsd);
        return { v: amount * per, label: "IRT", per: per, note: t("crossNote") };
      }
      return null;
    }
    // مقصد جهانی: amount × (نرخِ مقصد ÷ نرخِ مبدأ) — هر دو «به ازای ۱ دلار»
    const tl = String(target).toLowerCase();
    if (state.intl && state.intl.rates) {
      const rT = state.intl.rates[tl];
      if (!rT) return null;
      const usdToman = state.toman && state.toman.currencies && state.toman.currencies.USD;
      let per = null;
      let viaToman = false;
      if (cur === "IRT") {
        // تومان → هر ارز: از نرخ دلار تومانی TGJU
        if (usdToman) { per = rT / usdToman; viaToman = true; }
      } else if (cur === "IRR") {
        // ریال → هر ارز: ÷۱۰ بعد کراس
        if (usdToman) { per = rT / (10 * usdToman); viaToman = true; }
      } else {
        const rC = state.intl.rates[String(cur).toLowerCase()];
        if (rC) per = rT / rC;
      }
      if (per) {
        return { v: amount * per, label: target, per: per, note: viaToman ? " (" + t("viaTomanNote") + ")" : "" };
      }
    }
    return null;
  }

  function formatValue(v, target) {
    if (target === "IRT") {
      return I18N.fmtNum(lang, Math.round(v)) + " " + t("tomanWord");
    }
    const maxDigits = v >= 100 ? 0 : v >= 1 ? 2 : 4;
    const minDigits = target === "JPY" || target === "KRW" ? 0 : v >= 100 ? 0 : 2;
    return I18N.fmtNum(lang, v, minDigits, maxDigits) + " " + target;
  }

  function timeStr(ms) {
    try {
      return new Date(ms).toLocaleTimeString(lang === "fa" ? "fa-IR" : undefined);
    } catch (e) { return ""; }
  }

  function srcLine() {
    if (state.target === "IRT") {
      const manual = state.toman && state.toman.source === "manual";
      const s = (manual ? "TGJU (" + t("manual") + ")" : "TGJU");
      return s + (state.toman ? " · " + timeStr(state.toman.updatedAt) : "");
    }
    return (state.intl && state.intl.source ? state.intl.source : "—") +
      (state.intl ? " · " + timeStr(state.intl.updatedAt) : "");
  }

  function makeTag(amount, cur) {
    // اگر قیمت دقیقاً به همان ارزِ مقصد بود، بَج تکراری لازم نیست (شامل قیمت‌های تومانی)
    if (cur === state.target) return null;
    const conv = convert(amount, cur);
    if (!conv) return null;
    const span = document.createElement("span");
    span.className = TAG_CLASS;
    span.textContent = "≈ " + formatValue(conv.v, state.target === "IRT" ? "IRT" : state.target);
    let perStr;
    if (state.target === "IRT") {
      // نرخ‌های کوچک (مثل ریال ۰٫۱) با دو اعشار، بقیه گرد
      perStr = conv.per < 1
        ? I18N.fmtNum(lang, conv.per, 2, 2)
        : I18N.fmtNum(lang, Math.round(conv.per));
    } else {
      perStr = I18N.fmtNum(lang, conv.per, null, 4);
    }
    span.title =
      (VER ? "[" + VER + "] " : "") +
      "1 " + cur + " = " + perStr + " " + (state.target === "IRT" ? t("tomanWord") : state.target) +
      (conv.note || "") +
      " — " + t("source", { s: srcLine() });
    span.dir = lang === "fa" ? "rtl" : "ltr";
    return span;
  }

  // یک گره متنی را پردازش می‌کند: اگر مبلغ ارزی داشت، آن را در یک span
  // علامت‌گذاری‌شده می‌پیچد و تگ معادل را کنارش می‌گذارد.
  function processTextNode(node) {
    const text = node.nodeValue;
    if (!text || text.length > 2000) return;

    CUR_REGEX.lastIndex = 0;
    if (!CUR_REGEX.test(text)) return;

    CUR_REGEX.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    let found = false;

    while ((match = CUR_REGEX.exec(text)) !== null) {
      // محافظ در برابر تطبیق خالی (حلقه بی‌نهایت)
      if (match.index === CUR_REGEX.lastIndex) CUR_REGEX.lastIndex++;

      const isPrefix = match[3] !== undefined;
      const cur = isPrefix
        ? resolveCurrency(match[1], match[2])
        : resolveCurrency(match[7], match[8]);
      const amountStr = isPrefix ? match[3] : match[5];
      const magLetter = isPrefix ? match[4] : match[6];
      const amount = applyMag(parseAmount(amountStr), magLetter);
      const matchText = match[0];
      const end = match.index + matchText.length;

      // متن قبل از مبلغ (دست‌نخورده)
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // محافظ سایت تومانی: اگر کد ریال/IRR matched ولی اطرافش «تومان» هست و «ریال» نیست → قیمت تومانی است
      let skipLocal = false;
      if (cur === "IRR") {
        const ctx = text.slice(Math.max(0, match.index - 24), Math.min(text.length, end + 24));
        const parentText = node.parentElement && node.parentElement.textContent &&
          node.parentElement.textContent.length < 500 ? node.parentElement.textContent : "";
        const hasToman = /تومان|تومن/.test(ctx) || /تومان|تومن/.test(parentText);
        const hasRial = /ریال|ريال/.test(ctx) || /ریال|ريال/.test(parentText);
        if (hasToman && !hasRial) skipLocal = true;
      }
      const tag = cur && !skipLocal && !isNaN(amount) && amount > 0 ? makeTag(amount, cur) : null;
      if (tag) {
        // قیمت اصلی (شاملِ نماد و پسوند) + تگ معادل داخل یک wrapper علامت‌گذاری‌شده
        const wrap = document.createElement("span");
        wrap.className = WRAP_CLASS;
        wrap.setAttribute(PROCESSED_ATTR, "1");
        wrap.setAttribute(ORIG_ATTR, matchText);
        wrap.appendChild(document.createTextNode(matchText));
        wrap.appendChild(tag);
        frag.appendChild(wrap);
        found = true;
      } else {
        frag.appendChild(document.createTextNode(matchText));
      }
      lastIndex = end;
    }

    if (!found) return; // چیز معتبری پیدا نشد، دست نزن
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    const parent = node.parentNode;
    if (parent) parent.replaceChild(frag, node);
  }

  function shouldSkip(el) {
    if (!el) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.isContentEditable) return true;
    if (el.closest && el.closest("." + TAG_CLASS + ", ." + WRAP_CLASS)) return true;
    return false;
  }

  // تگ‌هایی که نباید داخلشان دست بزنیم
  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT",
    "OPTION", "CODE", "PRE", "KBD"
  ]);

  function scan(root) {
    if (!state.enabled) return;
    if (state.target === "IRT" && !(state.toman && Object.keys(state.toman.currencies).length)) return;
    if (state.target !== "IRT" && !(state.intl && Object.keys(state.intl.rates).length)) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (shouldSkip(parent)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(processTextNode);
  }

  // همه‌ی تگ‌ها را حذف و قیمت اصلی را بازمی‌گرداند (برای خاموش‌کردن یا تغییر مقصد)
  function removeAllTags() {
    const wraps = document.querySelectorAll("." + WRAP_CLASS);
    wraps.forEach((w) => {
      const orig = w.getAttribute(ORIG_ATTR);
      const text = orig != null ? orig : (w.firstChild ? w.firstChild.nodeValue : "");
      w.replaceWith(document.createTextNode(text));
    });
  }

  // بازسازی تگ‌ها با تنظیمات جدید (تغییر ارز مقصد)
  function rebuild() {
    removeAllTags();
    if (state.enabled) scan(document.body);
  }

  // مشاهده تغییرات صفحه (محتوای داینامیک / SPA)
  let scanScheduled = false;
  const pendingRoots = new Set();

  function scheduleScan(root) {
    pendingRoots.add(root || document.body);
    if (scanScheduled) return;
    scanScheduled = true;
    requestIdleCallback(() => {
      scanScheduled = false;
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      roots.forEach((r) => {
        if (r && r.nodeType === Node.ELEMENT_NODE) scan(r);
      });
    });
  }

  const observer = new MutationObserver((mutations) => {
    if (!state.enabled) return;
    for (const m of mutations) {
      for (const added of m.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE) {
          if (added.classList && (added.classList.contains(TAG_CLASS) || added.classList.contains(WRAP_CLASS))) {
            continue;
          }
          scheduleScan(added);
        } else if (added.nodeType === Node.TEXT_NODE) {
          scheduleScan(added.parentElement || document.body);
        }
      }
    }
  });

  function startObserving() {
    if (observing) return;
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      observing = true;
    }
  }

  // requestIdleCallback fallback
  if (typeof window.requestIdleCallback !== "function") {
    window.requestIdleCallback = (cb) => setTimeout(() => cb({ timeRemaining: () => 50 }), 200);
  }

  // گرفتن نرخ‌ها و تنظیمات از background سپس اولین اسکن
  function init() {
    chrome.runtime.sendMessage({ type: "GET_RATE" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response) {
        state.toman = response.rate || null;
        state.intl = response.intl || null;
        state.enabled = response.enabled !== false;
        state.target = (response.settings && response.settings.target) || "IRT";
        lang = I18N.resolve(response.settings && response.settings.lang);
        t = I18N.makeT(lang);
      }
      if (state.enabled) scan(document.body);
      startObserving(); // همیشه روشن تا کلید Live و محتوای داینامیک کار کند
    });
  }

  // واکنش زنده به تغییر نرخ، تنظیمات یا کلید روشن/خاموش
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    let needRebuild = false;

    if (changes.usdTomanRate) {
      state.toman = changes.usdTomanRate.newValue || null;
      needRebuild = true;
    }
    if (changes.intlRate) {
      state.intl = changes.intlRate.newValue || null;
      needRebuild = true;
    }
    if (changes.settings) {
      const st = changes.settings.newValue || {};
      const newTarget = st.target || "IRT";
      const newLang = I18N.resolve(st.lang);
      if (newTarget !== state.target || newLang !== lang) needRebuild = true;
      state.target = newTarget;
      lang = newLang;
      t = I18N.makeT(lang);
    }
    if (changes.enabled) {
      state.enabled = changes.enabled.newValue !== false;
      if (state.enabled) {
        rebuild();
      } else {
        removeAllTags();
      }
      return;
    }
    if (needRebuild && state.enabled) rebuild();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
