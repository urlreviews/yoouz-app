/**
 * Comprehensive Multilingual Location Dictionary
 * Maps internationalized names (Hebrew, Arabic, French, German, Spanish, Turkish, Russian, Chinese, Japanese, Italian, etc.)
 * to standard English country and city names for instant search resolution across all worldwide users.
 */

export const MULTILINGUAL_COUNTRY_ALIASES: Record<string, string[]> = {
  "Israel": [
    "ישראל", "ישראל", "מדינת ישראל", "israel", "isr", "il", "إسرائيل", "دول إسرائيل", "israël", "israele"
  ],
  "United Arab Emirates": [
    "איחוד האמירויות", "איחוד האמירויות הערביות", "אמירויות", "דובאי", "אבו דאבי", "uae", "ae", "الإمارات", "الإمارات العربية المتحدة", "امارات", "emirats arabes unis", "emiratos arabes", "vereinigte arabische emirate", "birleşik arap emirlikleri", "оаэ", "阿联酋", "アラブ首長国連邦"
  ],
  "United Kingdom": [
    "בריטניה", "אנגליה", "הממלכה המאוחדת", "לונדון", "uk", "gb", "gbr", "great britain", "england", "المملكة المتحدة", "بريطانيا", "انجلترا", "royaume-uni", "reino unido", "großbritannien", "birleşik krallık", "ingiltere", "великобритания", "англия", "英国", "イギリス"
  ],
  "United States": [
    "ארצות הברית", "ארהב", "ארה\"ב", "אמריקה", "us", "usa", "america", "الولايات المتحدة", "أمريكا", "états-unis", "estados unidos", "vereinigte staaten", "amerika", "amerika birleşik devletleri", "сша", "америка", "美国", "アメリカ"
  ],
  "France": [
    "צרפת", "פריז", "france", "fr", "fra", "فرنسا", "francia", "frankreich", "fransa", "франция", "法国", "フランス"
  ],
  "Germany": [
    "גרמניה", "ברלין", "germany", "de", "deu", "deutschland", "ألمانيا", "allemagne", "alemania", "almanya", "германия", "德国", "ドイツ"
  ],
  "Spain": [
    "ספרד", "מדריד", "ברצלונה", "spain", "es", "esp", "españa", "إسبانيا", "espagne", "spanien", "ispanya", "испания", "西班牙", "スペイン"
  ],
  "Italy": [
    "איטליה", "רומא", "מילאנו", "italy", "it", "ita", "italia", "إيطاليا", "italie", "italien", "italya", "италия", "意大利", "イタリア"
  ],
  "Canada": [
    "קנדה", "טורונטו", "canada", "ca", "can", "كندا", "kanada", "канада", "加拿大"
  ],
  "Australia": [
    "אוסטרליה", "סידני", "australia", "au", "aus", "أستراليا", "australie", "avustralya", "австралия", "澳大利亚", "オーストラリア"
  ],
  "Turkey": [
    "טורקיה", "איסטנבול", "turkey", "tr", "tur", "türkiye", "تركيا", "turquie", "turquía", "türkei", "турция", "土耳其", "トルコ"
  ],
  "Saudi Arabia": [
    "ערב הסעודית", "סעודיה", "ריאד", "saudi arabia", "sa", "sau", "السعودية", "المملكة العربية السعودية", "arabie saoudite", "arabia saudita", "suudi arabistan", "саудовская аравия", "沙特阿拉伯", "サウジアラビア"
  ],
  "Netherlands": [
    "הולנד", "אמסטרדם", "netherlands", "nl", "nld", "holland", "nederland", "هولندا", "pays-bas", "países bajos", "niederlande", "hollanda", "нидерланды", "голландия", "荷兰", "オランダ"
  ],
  "Belgium": [
    "בלגיה", "בריסל", "belgium", "be", "bel", "belgique", "belgië", "belgien", "בלגיה", "بلجيكا", "bélgica", "belçika", "бельгия", "比利时", "ベルギー"
  ],
  "Switzerland": [
    "שוויץ", "שווייץ", "ציריך", "ז'נבה", "switzerland", "ch", "che", "schweiz", "suisse", "svizzera", "سويسرا", "suiza", "İsviçre", "швейцария", "瑞士", "スイス"
  ],
  "Austria": [
    "אוסטריה", "וינה", "austria", "at", "aut", "österreich", "النمسا", "autriche", "avusturya", "австрия", "奥地利", "オーストリア"
  ],
  "Russia": [
    "רוסיה", "מוסקבה", "russia", "ru", "rus", "россия", "روسيا", "russie", "rusia", "russland", "rusya", "俄罗斯", "ロシア"
  ],
  "China": [
    "סין", "בייג'ינג", "שנגחאי", "china", "cn", "chn", "الصين", "chine", "chine", "çin", "китай", "中国"
  ],
  "Japan": [
    "יפן", "טוקיו", "japan", "jp", "jpn", "nippon", "اليابان", "japon", "japón", "japonya", "япония", "日本"
  ],
  "India": [
    "הודו", "מומבאי", "דלהי", "india", "in", "ind", "الهند", "inde", "hindistan", "индия", "印度", "インド"
  ],
  "Brazil": [
    "ברזיל", "סאו פאולו", "brazil", "br", "bra", "brasil", "البرازيل", "brésil", "brezilya", "бразилия", "巴西", "ブラジル"
  ],
  "Mexico": [
    "מקסיקו", "mexico", "mx", "mex", "méxico", "المكسিক", "المكسيك", "meksika", "мексика", "墨西哥", "メキシコ"
  ],
  "Argentina": [
    "ארגנטינה", "בואנוס איירס", "argentina", "ar", "arg", "الأرجنتين", "argentine", "arjantin", "аргентина", "阿根廷"
  ],
  "Egypt": [
    "מצרים", "קהיר", "egypt", "eg", "egy", "مصر", "égypte", "egipto", "ägypten", "mısır", "египет", "埃及", "エジプト"
  ],
  "Greece": [
    "יוון", "אתונה", "greece", "gr", "grc", "hellas", "اليونان", "grèce", "grecia", "griechenland", "yunanistan", "греция", "希腊", "ギリシャ"
  ],
  "Portugal": [
    "פורטוגל", "ליסבון", "portugal", "pt", "prt", "البرتغال", "portekiz", "португалия", "葡萄牙", "ポルトガル"
  ],
  "Poland": [
    "פולין", "ורשה", "poland", "pl", "pol", "polska", "بولندا", "pologne", "polonia", "polen", "polonya", "польша", "波兰", "ポーランド"
  ],
  "Sweden": [
    "שוודיה", "שטוקהולם", "sweden", "se", "swe", "sverige", "السويد", "suède", "suecia", "schweden", "İsveç", "швеция", "瑞典", "スウェーデン"
  ],
  "Norway": [
    "נורווגיה", "אוסלו", "norway", "no", "nor", "norge", "النرويج", "norvège", "noruega", "norwegen", "norveç", "норвегия", "挪威", "ノルウェー"
  ],
  "Denmark": [
    "דנמרק", "קופנהגן", "denmark", "dk", "dnk", "danmark", "الدنمارك", "danemark", "dinamarca", "dänemark", "danimarka", "дания", "丹麦", "デンマーク"
  ],
  "Finland": [
    "פינלנד", "הלסינקי", "finland", "fi", "fin", "suomi", "فنלندا", "فنلندا", "finlande", "finlandia", "finnland", "финляндия", "芬兰", "フィンランド"
  ],
  "Cyprus": [
    "קפריסין", "ניקוסיה", "cyprus", "cy", "cyp", "קפריסין", "قبرص", "chypre", "chipre", "zypern", "kıbrıs", "кипр", "塞浦路斯"
  ],
  "Jordan": [
    "ירדן", "עמאן", "jordan", "jo", "jor", "الأردن", "jordanie", "jordania", "jordanien", "ürdün", "иордания", "约旦"
  ],
  "Lebanon": [
    "לבנון", "ביירות", "lebanon", "lb", "lbn", "לבנון", "لبنان", "liban", "líbano", "lübnan", "ливан", "黎巴嫩"
  ],
  "Qatar": [
    "קטאר", "דוחה", "qatar", "qa", "qat", "قطر", "катар", "卡塔尔"
  ],
  "Kuwait": [
    "כווית", "kuwait", "kw", "kwt", "الكويت", "koweit", "кувейт", "科威特"
  ],
  "Bahrain": [
    "בחריין", "bahrain", "bh", "bhr", "البحرين", "bahreïn", "бахрейн", "巴林"
  ],
  "Oman": [
    "עומאן", "עומן", "מוסקט", "oman", "om", "omn", "عمان", "سلطنة عمان", "оман", "阿曼"
  ],
  "Morocco": [
    "מרוקו", "קזבלנקה", "מרקש", "morocco", "ma", "mar", "المغرب", "maroc", "marruecos", "marokko", "fas", "марокко", "摩洛哥"
  ],
  "Ukraine": [
    "אוקראינה", "קייב", "ukraine", "ua", "ukr", "أوكرانيا", "ucrania", "ukrayna", "украина", "україна", "乌克兰"
  ],
  "South Africa": [
    "דרום אפריקה", "קייפטאון", "יוהנסבורג", "south africa", "za", "zaf", "جنوب أفريقيا", "afrique du sud", "sudáfrica", "südafrika", "güney afrika", "юар", "南非"
  ],
  "Singapore": [
    "סינגפור", "singapore", "sg", "sgp", "سنغافورة", "singapour", "singapur", "сингапур", "新加坡"
  ],
  "South Korea": [
    "דרום קוריאה", "קוריאה", "סיאול", "south korea", "korea", "kr", "kor", "كوريا الجنوبية", "corée du sud", "corea del sur", "südkorea", "güney kore", "южная корея", "韩国", "韓国"
  ],
  "Thailand": [
    "תאילנד", "בנגקוק", "thailand", "th", "tha", "تايلاند", "thaïlande", "tailandia", "tayland", "таиланд", "泰国"
  ],
  "Vietnam": [
    "וייטנאם", "vietnam", "vn", "vnm", "فيتنام", "viêt nam", "вьетнам", "越南"
  ],
  "Philippines": [
    "פיליפינים", "מנילה", "philippines", "ph", "phl", "الفلبين", "filipinas", "filipinler", "филиппины", "菲律宾"
  ],
  "Indonesia": [
    "אינדונזיה", "ג'קרטה", "באלי", "indonesia", "id", "idn", "إندونيسيا", "indonésie", "endonezya", "индонезия", "印度尼西亚"
  ],
  "Malaysia": [
    "מלזיה", "קואלה לומפור", "malaysia", "my", "mys", "ماليزيا", "malaisie", "malezya", "малайзия", "马来西亚"
  ],
  "Ireland": [
    "אירלנד", "דבלין", "ireland", "ie", "irl", "أيرלندا", "irlande", "irlanda", "irland", "irlanda", "ирландия", "爱尔兰"
  ],
  "Czech Republic": [
    "צ'כיה", "פראג", "czech republic", "czechia", "cz", "cze", "تشيكيا", "république tchèque", "república checa", "tschechien", "çekya", "чехия", "捷克"
  ],
  "Hungary": [
    "הונגריה", "בודפשט", "hungary", "hu", "hun", "magyarország", "المجر", "hongrie", "hungría", "ungarn", "macaristan", "венгрия", "匈牙利"
  ],
  "Romania": [
    "רומניה", "בוקרשט", "romania", "ro", "rou", "רומניה", "رومانيا", "roumanie", "rumania", "rumänien", "romanya", "румыния", "罗马尼亚"
  ],
  "Bulgaria": [
    "בולגריה", "סופיה", "bulgaria", "bg", "bgr", "بلغاريا", "bulgarie", "bulgarien", "bulgaristan", "болгария", "保加利亚"
  ],
  "Croatia": [
    "קרואטיה", "זאגרב", "croatia", "hr", "hrv", "hrvatska", "كرواتيا", "croatie", "croacia", "kroatien", "hırvatistan", "хорватия", "克罗地亚"
  ]
};

export const MULTILINGUAL_CITY_ALIASES: Record<string, string[]> = {
  "Tel Aviv": ["תל אביב", "תל-אביב", "ת\"א", "tel aviv", "تل أبيب", "tel aviv-yafo", "תל אביב יפו", "תל אביב-יפו"],
  "Jerusalem": ["ירושלים", "jerusalem", "القدس", "jérusalem", "jerusalén", "ierusalim", "иерусалим"],
  "Haifa": ["חיפה", "haifa", "حيفا", "haïfa"],
  "Rishon LeZion": ["ראשון לציון", "ראשלצ", "ראשל\"צ", "rishon lezion", "ريشون لتسيون"],
  "Petah Tikva": ["פתח תקווה", "פתח תקוה", "פ\"ת", "petah tikva", "بيتاح تكفا"],
  "Ashdod": ["אשדוד", "ashdod", "أشدود"],
  "Netanya": ["נתניה", "netanya", "نتانيا"],
  "Beer Sheva": ["באר שבע", "ב\"ש", "beer sheva", "beersheba", "بئر السبع"],
  "Holon": ["חולון", "holon", "حولون"],
  "Bnei Brak": ["בני ברק", "bnei brak", "بني براك"],
  "Ramat Gan": ["רמת גן", "ר\"ג", "ramat gan", "رمات غان"],
  "Rehovot": ["רחובות", "rehovot", "رحوفوت"],
  "Bat Yam": ["בת ים", "bat yam", "بات يام"],
  "Herzliya": ["הרצליה", "herzliya", "هرتسليا"],
  "Kfar Saba": ["כפר סבא", "כפר סבא", "kfar saba", "كفار سابا"],
  "Eilat": ["אילת", "eilat", "إيلات"],
  "Ra'anana": ["רעננה", "raanana", "רעננה"],
  "Modi'in": ["מודיעין", "מודיעין-מכבים-רעות", "modiin"],
  "Abu Dhabi": ["אבו דאבי", "אבו-דאבי", "abu dhabi", "أبو ظبي", "ابو ظبي", "ابوظبي", "abu dabi", "абу-даби"],
  "Dubai": ["דובאי", "dubai", "دبي", "dubái", "дубай"],
  "Sharjah": ["שארג'ה", "sharjah", "الشارقة", "شارقة"],
  "Ajman": ["עג'מאן", "ajman", "عجمان"],
  "Ras Al Khaimah": ["ראס אל ח'יימה", "ראס אל חיימה", "ras al khaimah", "רס אל ח'ימה", "رأس الخيمة"],
  "London": ["לונדון", "london", "لندن", "londres", "лондон"],
  "Manchester": ["מנצ'סטר", "manchester", "مانشסטר", "مانشستر"],
  "Birmingham": ["ברמינגהם", "birmingham", "برمنغهام"],
  "Liverpool": ["ליברפול", "liverpool", "ليفربول"],
  "New York": ["ניו יורק", "ניו-יורק", "new york", "نيويورك", "nueva york", "нью-йорк"],
  "Los Angeles": ["לוס אנג'לס", "לוס אנגלס", "los angeles", "لوس أنجلوس", "лос-анджелес"],
  "Chicago": ["שיקגו", "chicago", "شيكاغو"],
  "Miami": ["מיאמי", "miami", "ميامي"],
  "San Francisco": ["סן פרנסיסקו", "san francisco", "سان فرانسيسكو"],
  "Paris": ["פריז", "פריס", "paris", "باريس", "париж"],
  "Berlin": ["ברלין", "berlin", "ברלין", "برلين", "берлин"],
  "Munich": ["מינכן", "munich", "münchen", "ميونخ"],
  "Rome": ["רומא", "rome", "roma", "רומא", "روما", "рим"],
  "Milan": ["מילאנו", "milan", "milano", "ميلانو"],
  "Madrid": ["מדריד", "madrid", "مدريد", "мадрид"],
  "Barcelona": ["ברצלונה", "barcelona", "برشلونة"],
  "Amsterdam": ["אמסטרדם", "amsterdam", "أمستردאם", "амстердам"],
  "Brussels": ["בריסל", "brussels", "bruxelles", "بروكسל"],
  "Riyadh": ["ריאד", "riyadh", "الرياض", "رياض"],
  "Jeddah": ["ג'דה", "jeddah", "جدة"],
  "Istanbul": ["איסטנבול", "istanbul", "إسطنبול", "стамбул"],
  "Ankara": ["אנקרה", "ankara", "أنقرة"],
  "Moscow": ["מוסקבה", "moscow", "moskva", "موسكو", "москва"],
  "Toronto": ["טורונטו", "toronto", "تورونتو"],
  "Sydney": ["סידני", "sydney", "سيدني"],
  "Tokyo": ["טוקיו", "tokyo", "طوكيو", "токио"]
};

/**
 * Checks if a search query matches a country name across all internationalized languages
 */
export function matchCountryMultilingual(countryName: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (countryName.toLowerCase().includes(q)) return true;

  const aliases = MULTILINGUAL_COUNTRY_ALIASES[countryName];
  if (aliases && aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
    return true;
  }

  return false;
}

/**
 * Checks if a search query matches a city/state option across internationalized languages
 */
export function matchOptionMultilingual(option: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (option.toLowerCase().includes(q)) return true;

  // Check city alias mapping
  for (const [canonicalCity, aliases] of Object.entries(MULTILINGUAL_CITY_ALIASES)) {
    if (option.toLowerCase().includes(canonicalCity.toLowerCase())) {
      if (aliases.some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
        return true;
      }
    }
  }

  return false;
}
