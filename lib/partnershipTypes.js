// Kinds of partnership a listing can offer. Shared between server and client,
// so this must NOT live in a "use client" module.
export const PARTNERSHIP_TYPES = [
  {
    value: "barter",
    label: "Бартер",
    hint: "Обмен товарами или услугами без денег",
  },
  {
    value: "sponsorship",
    label: "Спонсорство",
    hint: "Поддержка события или проекта в обмен на упоминание и охваты",
  },
  {
    value: "cross_promo",
    label: "Кросс-промо",
    hint: "Взаимное продвижение друг друга на своих аудиториях",
  },
  {
    value: "affiliate",
    label: "Аффилейт",
    hint: "Вознаграждение за приведённые продажи",
  },
  {
    value: "distribution",
    label: "Дистрибуция",
    hint: "Продажа или размещение продукта партнёра через свои каналы",
  },
  {
    value: "referral",
    label: "Реферальная программа",
    hint: "Обмен рекомендациями и клиентами",
  },
];

export const PARTNERSHIP_LABEL = Object.fromEntries(
  PARTNERSHIP_TYPES.map((t) => [t.value, t.label])
);

export const PARTNERSHIP_VALUES = PARTNERSHIP_TYPES.map((t) => t.value);

export const DEFAULT_PARTNERSHIP = "barter";

// Falls back to barter for unknown input rather than letting junk into the DB.
export function normalizePartnership(value) {
  const v = String(value || "").trim();
  return PARTNERSHIP_VALUES.includes(v) ? v : DEFAULT_PARTNERSHIP;
}
