// parse-core.js — هستهٔ خالصِ تشخیص قیمت ارزی (بدون DOM)
// این فایل هم در مرورگر (به‌عنوان پیش‌نیاز content.js) و هم در Node (برای تست) بارگذاری می‌شود.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.__CUR_CORE__ = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // نماد ارز → کد استاندارد. نمادهای دارای ابهام پیش‌فرض دارند:
  //   «$» → USD ، «¥» → JPY (با نماد صریح مثل C$/A$/US$ یا کد سه‌حرفی قابل تغییر است)
  const SYMBOL_TO_CUR = {
    "US$": "USD", "$": "USD",
    "€": "EUR", "£": "GBP",
    "C$": "CAD", "CA$": "CAD",
    "A$": "AUD", "AU$": "AUD",
    "¥": "JPY", "₺": "TRY", "元": "CNY",
    "₩": "KRW", "₹": "INR", "₽": "RUB", "₪": "ILS",
    "₫": "VND", "฿": "THB", "₱": "PHP_C", "₴": "UAH",
    "zł": "PLN", "Kč": "CZK", "Ft": "HUF",
    "lei": "RON", "Lei": "RON", "LEI": "RON",
    "лв": "BGN", "грн": "UAH",
    "R$": "BRL", "NT$": "TWD", "HK$": "HKD", "S$": "SGD",
    "تومان": "IRT", "تومن": "IRT",
    "ریال": "IRR", "ريال": "IRR"
  };
  // ₱ نماد پزوی فیلیپین است؛ کد PHP را از لیست کدها حذف کردیم چون با زبان برنامه‌نویسی قاطی می‌شود.
  // این نگهدارنده فقط برای نماد است:
  const SYMBOL_ALIAS = { PHP_C: "PHP" };

  // نمادهایی که از حروف ساخته شده‌اند (نه علامت) — در regex باید \b بگیرند
  // تا داخل کلمات دیگر (مثل «klein») تطبیق نخورند.
  const ALPHABETIC_SYMBOLS = ["lei", "Lei", "LEI", "zł", "Kč", "Ft", "лв", "грн"];

  // کد ارز → کد استاندارد (فقط حروف بزرگ — «Try» و «Cad» انگلیسی دیگر قاطی نمی‌شود)
  // عمداً حذف‌شده‌ها: ALL، SOS، BAM (کلمهٔ معمولی)، PHP (زبان برنامه‌نویسی)،
  // COP (اجلاس اقلیمی COP30!)، AMD (شرکت AMD + مدل CPU).
  const CODE_TO_CUR = {
    USD: "USD", EUR: "EUR", GBP: "GBP", CHF: "CHF", JPY: "JPY",
    CNY: "CNY", RMB: "CNY", KRW: "KRW", SGD: "SGD", HKD: "HKD", TWD: "TWD",
    INR: "INR", PKR: "PKR", BDT: "BDT", LKR: "LKR", THB: "THB", MYR: "MYR",
    IDR: "IDR", VND: "VND", TRY: "TRY",
    AED: "AED", SAR: "SAR", QAR: "QAR", KWD: "KWD", BHD: "BHD", OMR: "OMR", JOD: "JOD",
    ILS: "ILS", EGP: "EGP", MAD: "MAD", TND: "TND", DZD: "DZD",
    ZAR: "ZAR", NGN: "NGN", KES: "KES", GHS: "GHS",
    RUB: "RUB", UAH: "UAH",
    PLN: "PLN", CZK: "CZK", HUF: "HUF", RON: "RON", BGN: "BGN", RSD: "RSD",
    SEK: "SEK", NOK: "NOK", DKK: "DKK", ISK: "ISK",
    MXN: "MXN", BRL: "BRL", ARS: "ARS", CLP: "CLP", PEN: "PEN",
    CAD: "CAD", AUD: "AUD", NZD: "NZD",
    GEL: "GEL", AZN: "AZN", KZT: "KZT", UZS: "UZS", IRR: "IRR",
    IRT: "IRT"
  };

  // پسوند بزرگی → ضریب
  const MAG_MULT = { k: 1e3, m: 1e6, b: 1e9 };

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // نمادها را از بلندترین به کوتاه‌ترین مرتب می‌کنیم تا «US$» قبل از «$» تطبیق بخورد.
  // نکته: \b در JS فقط با [A-Za-z0-9_] کار می‌کند و برای حروف غیر ASCII (ł، č، л، г) می‌شکند؛
  // پس برای نمادهای حرفی از lookaround استفاده می‌کنیم.
  const symbolTokens = Object.keys(SYMBOL_TO_CUR)
    .sort((a, b) => b.length - a.length)
    .map((t) =>
      ALPHABETIC_SYMBOLS.indexOf(t) > -1
        ? "(?<![A-Za-z])" + escapeRegex(t) + "(?![A-Za-z])"
        : escapeRegex(t)
    )
    .join("|");
  const codeTokens = Object.keys(CODE_TO_CUR).join("|");

  // عدد با جداکنندهٔ هزارگان و اعشار — همهٔ فرمت‌های رایج دنیا:
  //   23 628,46  (رومانیایی/فرانسوی — فاصله هزارگان، ویرگول اعشار؛ شامل NBSP و نازک‌فاصله)
  //   1.500 / 23.628,46  (آلمانی/ایتالیایی — نقطه هزارگان، ویرگول اعشار)
  //   1,299.99  (انگلیسی — ویرگول هزارگان، نقطه اعشار)
  //   46 / 0.99 / 2,5  (ساده)
  const SP = "[ \\u00A0\\u202F\\u2009]"; // فاصلهٔ هزارگان (معمولی و NBSP)
  const D = "[0-9\\u06F0-\\u06F9\\u0660-\\u0669]"; // ارقام لاتین + فارسی (۰-۹) + عربی (٠-٩)
  const FA_TH = "\\u066C"; // جداکنندهٔ هزارگان فارسی ٬
  const FA_DE = "\\u066B"; // اعشار فارسی ٫
  const NUM =
    D + "{1,3}(?:" + SP + D + "{3})+(?:[.,]" + D + "{1,2})?(?!" + D + ")" +
    "|" + D + "{1,3}(?:\\." + D + "{3})+(?:," + D + "{1,2})?(?!" + D + ")" +
    "|" + D + "{1,3}(?:," + D + "{3})+(?:\\." + D + "{1,2})?(?!" + D + ")" +
    "|" + D + "{1,3}(?:" + FA_TH + D + "{3})+(?:" + FA_DE + D + "{1,2})?(?!" + D + ")" +
    "|" + D + "+(?:[.,]" + D + "{1,2})?(?!" + D + ")" +
    "|" + D + "+(?:" + FA_DE + D + "{1,2})?(?!" + D + ")";
  // پسوند بزرگی، فقط وقتی حرفِ بعدش حرف انگلیسی نباشد (تا «$5Kids» تبدیل نشود)
  const MAG = "([KkMmBb])?(?![A-Za-z])";

  // فرم پیشوندی:  نماد/کد + عدد   →  $1.1K ، €2.5M ، USD 10
  // فرم پسوندی:   عدد + نماد/کد   →  10 EUR ، 5$ ، 100 lei
  // گروه‌ها:
  //   1: نماد(پیشوند) 2: کد(پیشوند) 3: عدد(پیشوند) 4: پسوند(پیشوند)
  //   5: عدد(پسوند)   6: پسوند(پسوند) 7: نماد(پسوند) 8: کد(پسوند)
  const CUR_REGEX = new RegExp(
    "(?:(" + symbolTokens + ")|\\b(" + codeTokens + ")\\b)\\s?(" + NUM + ")" + MAG +
      "|(" + NUM + ")" + MAG + "\\s?(?:(" + symbolTokens + ")|\\b(" + codeTokens + ")\\b)",
    "g"
  );

  function resolveCurrency(symbolTok, codeTok) {
    if (symbolTok) {
      const s = SYMBOL_TO_CUR[symbolTok]; // نمادها case-sensitive هستند
      if (s) return SYMBOL_ALIAS[s] || s;
    }
    if (codeTok) {
      const c = CODE_TO_CUR[codeTok]; // کدها فقط بزرگ — بدون flag «i»
      if (c) return SYMBOL_ALIAS[c] || c;
    }
    return null;
  }

  function parseAmount(str) {
    // نرمال‌سازی همهٔ فرمت‌ها به عدد استاندارد
    let s = String(str)
      .replace(/[\u06F0-\u06F9]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x06F0 + 48)) // ۰-۹ → 0-9
      .replace(/[\u0660-\u0669]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x0660 + 48)); // ٠-٩ → 0-9
    s = s.replace(/[ \u00A0\u202F\u2009\u066C]/g, ""); // فاصله‌ها و جداکنندهٔ هزارگان فارسی
    s = s.replace(/[\u066B]/g, "."); // اعشار فارسی
    const hasC = s.indexOf(",") > -1;
    const hasD = s.indexOf(".") > -1;
    if (hasC && hasD) {
      // هر دو هست: آخرین‌شان اعشار است، دیگری هزارگان (1,299.99 یا 23.628,46)
      const lastDec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
      const thous = lastDec === "," ? "." : ",";
      s = s.split(thous).join("");
      s = s.replace(lastDec, ".");
    } else if (hasC) {
      // فقط ویرگول: اگر زنجیرهٔ «۳رقمی» بود هزارگان است (10,500) وگرنه اعشار (2,5)
      s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.split(",").join("") : s.replace(",", ".");
    } else if (hasD) {
      // فقط نقطه: زنجیرهٔ «۳رقمی» = هزارگان (1.500 یا 100.000) وگرنه اعشار (0.99)
      s = /^\d{1,3}(\.\d{3})+$/.test(s) ? s.split(".").join("") : s;
    }
    return parseFloat(s);
  }

  function applyMag(amount, magLetter) {
    if (!magLetter) return amount;
    const mult = MAG_MULT[magLetter.toLowerCase()];
    return mult ? amount * mult : amount;
  }

  return {
    SYMBOL_TO_CUR: SYMBOL_TO_CUR,
    CODE_TO_CUR: CODE_TO_CUR,
    CUR_REGEX: CUR_REGEX,
    resolveCurrency: resolveCurrency,
    parseAmount: parseAmount,
    applyMag: applyMag,
    MAG_MULT: MAG_MULT
  };
});
