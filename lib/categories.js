// Shared between server and client components — must NOT live in a "use client"
// module, or server components receive a client reference instead of the array.
export const CATEGORIES = [
  { value: "food", label: "Еда и напитки" },
  { value: "retail", label: "Ритейл" },
  { value: "media", label: "Медиа и реклама" },
  { value: "tech", label: "Технологии" },
  { value: "sport", label: "Спорт и фитнес" },
  { value: "events", label: "Мероприятия" },
  { value: "realestate", label: "Площадки и недвижимость" },
  { value: "beauty", label: "Красота" },
  { value: "health", label: "Здоровье" },
  { value: "education", label: "Образование" },
  { value: "auto", label: "Авто" },
  { value: "culture", label: "Культура" },
  { value: "entertainment", label: "Развлечения" },
  { value: "hospitality", label: "Отели и HoReCa" },
  { value: "other", label: "Другое" },
];

export const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));
