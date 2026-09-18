// i18n.js — دیکشنری چندزبانهٔ اکستنشن (فارسی · انگلیسی · اسپانیایی · آلمانی · ایتالیایی · رومانیایی)
// هم در popup و هم در content script بارگذاری می‌شود.
(function (root) {
  "use strict";

  var LANGS = ["fa", "en", "es", "de", "it", "ro"];

  // ---------- رشته‌های رابط کاربری ----------
  var UI = {
    fa: {
      extTitle: "💱 مبدل ارز — هر ارزی به هر ارزی",
      extShort: "مبدل ارز جهانی",
      subTitle: "هر ارزی به هر ارزی · ۶۰+ ارز · زنده",
      irtShort: "تومان ایران",
      langLabel: "زبان",
      langAuto: "خودکار (زبان مرورگر)",
      toggleShow: "نمایش معادل روی قیمت‌ها",
      convertTo: "تبدیل به:",
      perUnitToman: "تومان به ازای هر واحد ارز",
      perUnitTarget: "هر واحد = چقدر {t}",
      noRate: "نرخ در دسترس نیست",
      noIntlRate: "نرخ جهانی در دسترس نیست",
      quickConv: "🔄 مبدل سریع",
      refresh: "🔄 به‌روزرسانی نرخ‌ها",
      manualPh: "نرخ دلار دستی (تومان)",
      set: "ثبت",
      loading: "در حال بارگذاری…",
      commError: "خطا در ارتباط با اکستنشن.",
      source: "منبع: {s}",
      updated: "به‌روزرسانی: {t}",
      manual: "دستی",
      crossNote: " (کراس از نرخ جهانی دلار)",
      rialNote: "ریال ÷ ۱۰",
      viaTomanNote: " (با کراس نرخ تومان)",
      tomanWord: "تومان",
      hint1: "کدهای ارز فقط با حروف بزرگ پیدا می‌شوند (USD ، RON ، lei ، € …).",
      hint2: "حالت تومان: منبع TGJU · حالت‌های دیگر: نرخ‌های رسمی جهانی (روزانه).",
      gIran: "🇮🇷 ایران", gPopular: "پرمصرف", gEurope: "اروپا",
      gAsia: "آسیا", gAmericas: "آمریکا و اقیانوسیه", gAfrica: "آفریقا و سایر"
    },
    en: {
      extTitle: "💱 Currency Converter — any currency to any currency",
      extShort: "Currency Converter",
      subTitle: "Any → any · 60+ currencies · live",
      irtShort: "Iranian Toman",
      langLabel: "Language",
      langAuto: "Auto (browser language)",
      toggleShow: "Show converted amounts on prices",
      convertTo: "Convert to:",
      perUnitToman: "Toman per unit of currency",
      perUnitTarget: "One unit = how much {t}",
      noRate: "Rate unavailable",
      noIntlRate: "Global rates unavailable",
      quickConv: "🔄 Quick converter",
      refresh: "🔄 Refresh rates",
      manualPh: "Manual USD rate (toman)",
      set: "Set",
      loading: "Loading…",
      commError: "Extension communication error.",
      source: "Source: {s}",
      updated: "Updated: {t}",
      manual: "manual",
      crossNote: " (cross rate via global USD)",
      rialNote: "rial ÷ 10",
      viaTomanNote: " (prin cursul tomanului)",
      viaTomanNote: " (via tasso toman)",
      viaTomanNote: " (vía tasa de toman)",
      viaTomanNote: " (via toman rate)",
      tomanWord: "toman",
      hint1: "Codes are detected UPPERCASE only (USD, RON, lei, € …).",
      hint2: "Toman mode: TGJU · Other targets: official global rates (daily).",
      gIran: "🇮🇷 Iran", gPopular: "Popular", gEurope: "Europe",
      gAsia: "Asia", gAmericas: "Americas & Oceania", gAfrica: "Africa & others"
    },
    es: {
      extTitle: "💱 Conversor de divisas — de cualquier moneda a cualquier moneda",
      extShort: "Conversor de Divisas",
      subTitle: "De cualquier a cualquier · 60+ · en vivo",
      irtShort: "Toman iraní",
      langLabel: "Idioma",
      langAuto: "Automático (idioma del navegador)",
      toggleShow: "Mostrar equivalentes sobre los precios",
      convertTo: "Convertir a:",
      perUnitToman: "Toman por unidad de moneda",
      perUnitTarget: "Una unidad = cuánto {t}",
      noRate: "Tasa no disponible",
      noIntlRate: "Tasas globales no disponibles",
      quickConv: "🔄 Conversor rápido",
      refresh: "🔄 Actualizar tasas",
      manualPh: "Tasa manual del USD (toman)",
      set: "Fijar",
      loading: "Cargando…",
      commError: "Error de comunicación con la extensión.",
      source: "Fuente: {s}",
      updated: "Actualizado: {t}",
      manual: "manual",
      crossNote: " (cruce vía USD global)",
      rialNote: "rial ÷ 10",
      viaTomanNote: " (prin cursul tomanului)",
      viaTomanNote: " (via tasso toman)",
      viaTomanNote: " (vía tasa de toman)",
      viaTomanNote: " (via toman rate)",
      tomanWord: "toman",
      hint1: "Los códigos se detectan solo en MAYÚSCULAS (USD, RON, lei, € …).",
      hint2: "Modo toman: TGJU · Otros destinos: tasas globales oficiales (diarias).",
      gIran: "🇮🇷 Irán", gPopular: "Populares", gEurope: "Europa",
      gAsia: "Asia", gAmericas: "América y Oceanía", gAfrica: "África y otros"
    },
    de: {
      extTitle: "💱 Währungsrechner — von jeder Währung in jede Währung",
      extShort: "Währungsrechner",
      subTitle: "Beliebig → beliebig · 60+ Kurse · live",
      irtShort: "Iranischer Toman",
      langLabel: "Sprache",
      langAuto: "Automatisch (Browsersprache)",
      toggleShow: "Umrechnungsbeträge an Preisen anzeigen",
      convertTo: "Umrechnen in:",
      perUnitToman: "Toman pro Währungseinheit",
      perUnitTarget: "Eine Einheit = wie viel {t}",
      noRate: "Kurs nicht verfügbar",
      noIntlRate: "Globale Kurse nicht verfügbar",
      quickConv: "🔄 Schnellrechner",
      refresh: "🔄 Kurse aktualisieren",
      manualPh: "Manueller USD-Kurs (Toman)",
      set: "Setzen",
      loading: "Wird geladen…",
      commError: "Kommunikationsfehler mit der Erweiterung.",
      source: "Quelle: {s}",
      updated: "Aktualisiert: {t}",
      manual: "manuell",
      crossNote: " (Umweg über globalen USD)",
      rialNote: "Rial ÷ 10",
      viaTomanNote: " (über Toman-Kurs)",
      tomanWord: "Toman",
      hint1: "Codes werden nur GROSSGESCHRIEBEN erkannt (USD, RON, lei, € …).",
      hint2: "Toman-Modus: TGJU · Andere Ziele: offizielle globale Tageskurse.",
      gIran: "🇮🇷 Iran", gPopular: "Beliebt", gEurope: "Europa",
      gAsia: "Asien", gAmericas: "Amerika & Ozeanien", gAfrica: "Afrika & andere"
    },
    it: {
      extTitle: "💱 Convertitore valutario — da qualsiasi valuta a qualsiasi valuta",
      extShort: "Convertitore Valutario",
      subTitle: "Da qualsiasi a qualsiasi · 60+ · live",
      irtShort: "Toman iraniano",
      langLabel: "Lingua",
      langAuto: "Automatica (lingua del browser)",
      toggleShow: "Mostra gli equivalenti sui prezzi",
      convertTo: "Converti in:",
      perUnitToman: "Toman per unità di valuta",
      perUnitTarget: "Un'unità = quanto {t}",
      noRate: "Tasso non disponibile",
      noIntlRate: "Tassi globali non disponibili",
      quickConv: "🔄 Convertitore rapido",
      refresh: "🔄 Aggiorna i tassi",
      manualPh: "Tasso manuale USD (toman)",
      set: "Imposta",
      loading: "Caricamento…",
      commError: "Errore di comunicazione con l'estensione.",
      source: "Fonte: {s}",
      updated: "Aggiornato: {t}",
      manual: "manuale",
      crossNote: " (incrocio via USD globale)",
      rialNote: "rial ÷ 10",
      viaTomanNote: " (prin cursul tomanului)",
      viaTomanNote: " (via tasso toman)",
      viaTomanNote: " (vía tasa de toman)",
      viaTomanNote: " (via toman rate)",
      tomanWord: "toman",
      hint1: "I codici vengono rilevati solo in MAIUSCOLO (USD, RON, lei, € …).",
      hint2: "Modalità toman: TGJU · Altre destinazioni: tassi globali ufficiali (giornalieri).",
      gIran: "🇮🇷 Iran", gPopular: "Popolari", gEurope: "Europa",
      gAsia: "Asia", gAmericas: "America e Oceania", gAfrica: "Africa e altri"
    },
    ro: {
      extTitle: "💱 Convertor valutar — din orice monedă în orice monedă",
      extShort: "Convertor Valutar",
      subTitle: "Orice → orice · 60+ monede · live",
      irtShort: "Toman iranian",
      langLabel: "Limba",
      langAuto: "Automat (limba browserului)",
      toggleShow: "Afișează echivalentele pe prețuri",
      convertTo: "Convertește în:",
      perUnitToman: "Toman per unitate de monedă",
      perUnitTarget: "O unitate = cât {t}",
      noRate: "Curs indisponibil",
      noIntlRate: "Cursurile globale indisponibile",
      quickConv: "🔄 Convertor rapid",
      refresh: "🔄 Actualizează cursurile",
      manualPh: "Curs manual USD (toman)",
      set: "Setează",
      loading: "Se încarcă…",
      commError: "Eroare de comunicare cu extensia.",
      source: "Sursă: {s}",
      updated: "Actualizat: {t}",
      manual: "manual",
      crossNote: " (încrucișat prin USD global)",
      rialNote: "rial ÷ 10",
      viaTomanNote: " (prin cursul tomanului)",
      viaTomanNote: " (via tasso toman)",
      viaTomanNote: " (vía tasa de toman)",
      viaTomanNote: " (via toman rate)",
      tomanWord: "toman",
      hint1: "Codurile se detectează doar cu MAJUSCULE (USD, RON, lei, € …).",
      hint2: "Modul toman: TGJU · Alte destinații: cursuri globale oficiale (zilnice).",
      gIran: "🇮🇷 Iran", gPopular: "Populare", gEurope: "Europa",
      gAsia: "Asia", gAmericas: "America și Oceania", gAfrica: "Africa și altele"
    }
  };

  // ---------- نام ارزها (انگلیسی کامل؛ بقیه پرمصرف‌ها + fallback به انگلیسی) ----------
  var CUR_EN = {
    IRT: "Iran Toman (TGJU free market)",
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound", CHF: "Swiss Franc",
    TRY: "Turkish Lira", AED: "UAE Dirham", CAD: "Canadian Dollar", AUD: "Australian Dollar",
    NZD: "New Zealand Dollar", JPY: "Japanese Yen", CNY: "Chinese Yuan", KRW: "South Korean Won",
    SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", TWD: "Taiwan Dollar",
    INR: "Indian Rupee", PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka", LKR: "Sri Lankan Rupee",
    THB: "Thai Baht", MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah", VND: "Vietnamese Dong",
    SAR: "Saudi Riyal", QAR: "Qatari Riyal", KWD: "Kuwaiti Dinar", BHD: "Bahraini Dinar",
    OMR: "Omani Rial", JOD: "Jordanian Dinar", ILS: "Israeli Shekel",
    EGP: "Egyptian Pound", MAD: "Moroccan Dirham", TND: "Tunisian Dinar", DZD: "Algerian Dinar",
    ZAR: "South African Rand", NGN: "Nigerian Naira", KES: "Kenyan Shilling", GHS: "Ghanaian Cedi",
    RUB: "Russian Ruble", UAH: "Ukrainian Hryvnia",
    PLN: "Polish Zloty", CZK: "Czech Koruna", HUF: "Hungarian Forint",
    RON: "Romanian Leu", BGN: "Bulgarian Lev", RSD: "Serbian Dinar",
    SEK: "Swedish Krona", NOK: "Norwegian Krone", DKK: "Danish Krone", ISK: "Icelandic Krona",
    MXN: "Mexican Peso", BRL: "Brazilian Real", ARS: "Argentine Peso", CLP: "Chilean Peso", PEN: "Peruvian Sol",
    GEL: "Georgian Lari", AZN: "Azerbaijani Manat", KZT: "Kazakhstani Tenge", UZS: "Uzbek Som", IRR: "Iranian Rial"
  };

  var CUR_FA = {
    IRT: "تومان ایران (بازار آزاد TGJU)",
    USD: "دلار آمریکا", EUR: "یورو", GBP: "پوند انگلیس", CHF: "فرانک سوئیس",
    TRY: "لیر ترکیه", AED: "درهم امارات", CAD: "دلار کانادا", AUD: "دلار استرالیا",
    NZD: "دلار نیوزیلند", JPY: "ین ژاپن", CNY: "یوان چین", KRW: "وون کره",
    SGD: "دلار سنگاپور", HKD: "دلار هنگ‌کنگ", TWD: "دلار تایوان",
    INR: "روپیه هند", PKR: "روپیه پاکستان", BDT: "تاکا بنگلادش", LKR: "روپیه سریلانکا",
    THB: "بات تایلند", MYR: "رینگیت مالزی", IDR: "روپیه اندونزی", VND: "دانگ ویتنام",
    SAR: "ریال عربستان", QAR: "ریال قطر", KWD: "دینار کویت", BHD: "دینار بحرین",
    OMR: "ریال عمان", JOD: "دینار اردن", ILS: "شکل اسرائیل",
    EGP: "پوند مصر", MAD: "درهم مراکش", TND: "دینار تونس", DZD: "دینار الجزایر",
    ZAR: "رند آفریقای جنوبی", NGN: "نایرا نیجریه", KES: "شیلینگ کنیا", GHS: "سدی غنا",
    RUB: "روبل روسیه", UAH: "هریونیا اوکراین",
    PLN: "زلوتي لهستان", CZK: "کرون چک", HUF: "فورینت مجارستان",
    RON: "لئو رومانی", BGN: "لِو بلغارستان", RSD: "دینار صربستان",
    SEK: "کرون سوئد", NOK: "کرون نروژ", DKK: "کرون دانمارک", ISK: "کرون ایسلند",
    MXN: "پزو مکزیک", BRL: "رئال برزیل", ARS: "پزو آرژانتین", CLP: "پزو شیلی", PEN: "سول پرو",
    GEL: "لاری گرجستان", AZN: "منات آذربایجان", KZT: "تنگه قزاقستان", UZS: "سوم ازبکستان", IRR: "ریال ایران"
  };

  // پرمصرف‌ها در هر زبان؛ بقیه خودکار از انگلیسی fallback می‌شوند
  var CUR_EXTRA = {
    es: {
      IRT: "Toman iraní (mercado libre TGJU)",
      USD: "Dólar estadounidense", EUR: "Euro", GBP: "Libra esterlina", CHF: "Franco suizo",
      TRY: "Lira turca", AED: "Dirham de EAU", CAD: "Dólar canadiense", AUD: "Dólar australiano",
      JPY: "Yen japonés", CNY: "Yuan chino", INR: "Rupia india", SAR: "Riyal saudí",
      RON: "Leu rumano", PLN: "Zloty polaco", HUF: "Forinto húngaro", CZK: "Corona checa",
      RSD: "Dinar serbio", BGN: "Lev búlgaro", RUB: "Rublo ruso", UAH: "Grivna ucraniana",
      SEK: "Corona sueca", NOK: "Corona noruega", DKK: "Corona danesa", MXN: "Peso mexicano",
      BRL: "Real brasileño", KRW: "Won surcoreano", ILS: "Séquel israelí", GEL: "Lari georgiano"
    },
    de: {
      IRT: "Iranischer Toman (TGJU-Freimarkt)",
      USD: "US-Dollar", EUR: "Euro", GBP: "Britisches Pfund", CHF: "Schweizer Franken",
      TRY: "Türkische Lira", AED: "Dirham (VAE)", CAD: "Kanadischer Dollar", AUD: "Australischer Dollar",
      JPY: "Japanischer Yen", CNY: "Chinesischer Yuan", INR: "Indische Rupie", SAR: "Saudi-Riyal",
      RON: "Rumänischer Leu", PLN: "Polnischer Złoty", HUF: "Ungarischer Forint", CZK: "Tschechische Krone",
      RSD: "Serbischer Dinar", BGN: "Bulgarischer Lew", RUB: "Russischer Rubel", UAH: "Ukrainische Hrywnja",
      SEK: "Schwedische Krone", NOK: "Norwegische Krone", DKK: "Dänische Krone", MXN: "Mexikanischer Peso",
      BRL: "Brasilianischer Real", KRW: "Südkoreanischer Won", ILS: "Israelischer Schekel", GEL: "Georgischer Lari"
    },
    it: {
      IRT: "Toman iraniano (mercato libero TGJU)",
      USD: "Dollaro USA", EUR: "Euro", GBP: "Sterlina britannica", CHF: "Franco svizzero",
      TRY: "Lira turca", AED: "Dirham EAU", CAD: "Dollaro canadese", AUD: "Dollaro australiano",
      JPY: "Yen giapponese", CNY: "Yuan cinese", INR: "Rupia indiana", SAR: "Riyal saudita",
      RON: "Leu rumeno", PLN: "Złoty polacco", HUF: "Fiorino ungherese", CZK: "Corona ceca",
      RSD: "Dinaro serbo", BGN: "Lev bulgaro", RUB: "Rublo russo", UAH: "Grivna ucraina",
      SEK: "Corona svedese", NOK: "Corona norvegese", DKK: "Corona danese", MXN: "Peso messicano",
      BRL: "Real brasiliano", KRW: "Won sudcoreano", ILS: "Shekel israeliano", GEL: "Lari georgiano"
    },
    ro: {
      IRT: "Toman iranian (piața liberă TGJU)",
      USD: "Dolar american", EUR: "Euro", GBP: "Liră sterlină", CHF: "Franc elvețian",
      TRY: "Liră turcească", AED: "Dirham EAU", CAD: "Dolar canadian", AUD: "Dolar australian",
      JPY: "Yen japonez", CNY: "Yuan chinezesc", INR: "Rupie indiană", SAR: "Riyal saudit",
      RON: "Leu românesc", PLN: "Zloty polonez", HUF: "Forint maghiar", CZK: "Coroană cehă",
      RSD: "Dinar sârbesc", BGN: "Leva bulgară", RUB: "Rublă rusă", UAH: "Hrivnă ucraineană",
      SEK: "Coroană suedeză", NOK: "Coroană norvegiană", DKK: "Coroană daneză", MXN: "Peso mexican",
      BRL: "Real brazilian", KRW: "Won sud-coreean", ILS: "Șechel israelian", GEL: "Lari georgian"
    }
  };

  var CUR = { fa: CUR_FA, en: CUR_EN };
  Object.keys(CUR_EXTRA).forEach(function (l) {
    CUR[l] = Object.assign({}, CUR_EN, CUR_EXTRA[l]);
  });

  // ---------- توابع کمکی ----------
  function resolve(setting) {
    if (setting && setting !== "auto" && LANGS.indexOf(setting) > -1) return setting;
    var nav = (root.navigator && root.navigator.language) || "en";
    var short = String(nav).slice(0, 2).toLowerCase();
    return LANGS.indexOf(short) > -1 ? short : "en";
  }

  function makeT(lang) {
    return function (key, vars) {
      var d = UI[lang] || UI.en;
      var s = d[key] != null ? d[key] : UI.en[key] || key;
      if (vars) {
        Object.keys(vars).forEach(function (k) {
          s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
        });
      }
      return s;
    };
  }

  function curName(lang, code) {
    var m = CUR[lang] || CUR.en;
    return m[code] || CUR.en[code] || code;
  }

  // اعداد: فارسی ← رقم فارسی؛ بقیه ← رقم لاتین با کاما
  function fmtNum(lang, v, minFrac, maxFrac) {
    var loc = lang === "fa" ? "fa-IR" : "en-US";
    var opts = {};
    if (minFrac != null) opts.minimumFractionDigits = minFrac;
    if (maxFrac != null) opts.maximumFractionDigits = maxFrac;
    try { return Number(v).toLocaleString(loc, opts); }
    catch (e) { return String(v); }
  }

  root.__I18N__ = {
    LANGS: LANGS,
    UI: UI,
    CUR: CUR,
    resolve: resolve,
    makeT: makeT,
    curName: curName,
    fmtNum: fmtNum
  };
})(typeof self !== "undefined" ? self : this);
