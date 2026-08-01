// Deterministic demo data used when ANTHROPIC_API_KEY is not set, so the MVP
// runs and can be shown/deployed before the real key is plugged in.
// The shape is identical to what the model returns.

const MATCHES = {
  ru: [
    {
      title: "StreamLiga — стриминг спортивных трансляций",
      fit: "Прямое пересечение аудиторий: болельщики StreamLiga и молодая аудитория 18–35 — идеальная площадка для запуска под спортивный сезон.",
      give: "QR-столы и экраны в 40 залах + промо в соцсетях на 120k подписчиков.",
      get: "Рекламные слоты в трансляциях и интеграции комментаторов на аудиторию футбольных фанатов.",
      caveat: "Уточните права на трансляции конкретных матчей и совпадение по срокам сезона — окно активации узкое.",
      score: 88,
    },
    {
      title: "Coca-Cola дистрибьютор / бренд напитков",
      fit: "Классический бартер: напитки под меню пиццерий в обмен на охваты и точки контакта с целевой аудиторией.",
      give: "Место под ко-брендинг в залах, промо в соцсетях, площадки под активации.",
      get: "Поставка напитков под сезонное меню и совместный призовой фонд.",
      caveat: "Проверьте эксклюзивность — у сети может быть действующий контракт с другим брендом напитков.",
      score: 74,
    },
    {
      title: "EventPro — агентство мероприятий",
      fit: "Bellissimo даёт площадки, EventPro — организацию: вместе можно делать фестивали еды с медиа-охватом.",
      give: "40 точек как площадки под ивенты и промо в соцсетях.",
      get: "Организацию, ведущих, свет и сцену для мероприятий по бартеру.",
      caveat: "Согласуйте, кто несёт расходы на расходники и кто владеет собранной базой участников.",
      score: 69,
    },
  ],
  uz: [
    {
      title: "StreamLiga — sport translyatsiyalari",
      fit: "Auditoriyalar bevosita kesishadi: StreamLiga muxlislari va 18–35 yoshli yosh auditoriya — sport mavsumiga start uchun ideal maydon.",
      give: "40 zaldagi QR-stollar va ekranlar + 120k obunachi ijtimoiy tarmoqlarda promo.",
      get: "Translyatsiyalardagi reklama slotlari va futbol muxlislari auditoriyasiga integratsiyalar.",
      caveat: "Aniq o‘yinlar translyatsiya huquqlarini va mavsum muddatlariga mosligini tekshiring — aktivatsiya oynasi tor.",
      score: 88,
    },
    {
      title: "Ichimliklar brendi distribyutori",
      fit: "Klassik barter: pitseriya menyusiga ichimliklar evaziga qamrov va maqsadli auditoriya bilan aloqa nuqtalari.",
      give: "Zallarda ko-brending joyi, ijtimoiy tarmoqlarda promo, aktivatsiya maydonlari.",
      get: "Mavsumiy menyu uchun ichimliklar yetkazib berish va umumiy sovrin fondi.",
      caveat: "Eksklyuzivlikni tekshiring — tarmoqda boshqa ichimlik brendi bilan amaldagi shartnoma bo‘lishi mumkin.",
      score: 74,
    },
    {
      title: "EventPro — tadbirlar agentligi",
      fit: "Bellissimo maydon beradi, EventPro tashkil qiladi: birgalikda media qamrovli oziq-ovqat festivallarini o‘tkazish mumkin.",
      give: "40 nuqta tadbir maydoni sifatida va ijtimoiy tarmoqlarda promo.",
      get: "Tadbirlar uchun tashkil qilish, boshlovchilar, yorug‘lik va sahna barter asosida.",
      caveat: "Sarf materiallar xarajatini kim ko‘tarishini va yig‘ilgan ishtirokchilar bazasi kimga tegishli ekanini kelishing.",
      score: 69,
    },
  ],
};

const PROPOSAL = {
  ru: `Здравствуйте!

Мы — сеть пиццерий Bellissimo, 40 точек по Ташкенту с молодой аудиторией 18–35 лет. Предлагаем взаимовыгодный бартер под старт спортивного сезона.

С нашей стороны: QR-столы и экраны во всех залах, а также промо в соцсетях на 120 000 подписчиков. Взамен рассчитываем на рекламные слоты в ваших трансляциях и интеграции комментаторов на аудиторию футбольных фанатов.

Обе аудитории совпадают, поэтому активация усилит и ваш, и наш охват без денежных затрат. Готовы обсудить детали на этой неделе — когда вам удобно созвониться?

С уважением, команда Bellissimo`,
  uz: `Assalomu alaykum!

Biz — Bellissimo pitseriyalar tarmog‘i, Toshkent bo‘ylab 40 nuqta va 18–35 yoshli yosh auditoriya. Sport mavsumi starti uchun o‘zaro foydali barter taklif qilamiz.

Bizning tomondan: barcha zallarda QR-stollar va ekranlar hamda 120 000 obunachiga ijtimoiy tarmoqlarda promo. Evaziga translyatsiyalaringizdagi reklama slotlari va futbol muxlislari auditoriyasiga integratsiyalarni kutamiz.

Ikkala auditoriya mos keladi, shuning uchun aktivatsiya pul sarflamasdan har ikkalamizning qamrovni kuchaytiradi. Tafsilotlarni shu hafta muhokama qilishga tayyormiz — qachon qo‘ng‘iroq qilsak qulay bo‘ladi?

Hurmat bilan, Bellissimo jamoasi`,
};

export function mockMatches(lang) {
  return MATCHES[lang] || MATCHES.ru;
}

export function mockProposal(lang) {
  return PROPOSAL[lang] || PROPOSAL.ru;
}
