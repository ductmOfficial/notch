import type { MilestoneKind } from "@notch/db";

import type { Locale } from "./i18n/messages";

/**
 * Titles offered while typing a milestone, by kind. They only save typing: the app never
 * says when a milestone is due or whether it came early or late.
 */
export const MILESTONE_SUGGESTIONS: Record<Locale, Record<MilestoneKind, readonly string[]>> = {
  vi: {
    motor: [
      "Ngẩng đầu",
      "Lẫy",
      "Ngồi vững",
      "Bò",
      "Đứng vịn",
      "Tự đứng",
      "Bước đi đầu tiên",
      "Chạy",
    ],
    language: [
      "Cười thành tiếng",
      "Bập bẹ",
      "Gọi “mẹ”",
      "Gọi “bố”",
      "Nói từ đầu tiên",
      "Nói câu hai từ",
    ],
    teeth: ["Chiếc răng đầu tiên", "Răng hàm đầu tiên", "Mọc đủ răng sữa"],
    social: ["Nụ cười đầu tiên", "Vẫy tay chào", "Vỗ tay", "Ôm", "Chơi cùng bạn"],
    other: ["Bữa ăn dặm đầu tiên", "Cắt tóc lần đầu", "Lần đầu đi biển", "Ngày đầu đi nhà trẻ"],
  },
  en: {
    motor: [
      "Held head up",
      "Rolled over",
      "Sat without support",
      "Crawled",
      "Pulled to stand",
      "Stood alone",
      "First steps",
      "Ran",
    ],
    language: [
      "Laughed aloud",
      "Babbled",
      "Said “mama”",
      "Said “dada”",
      "First word",
      "Two-word phrase",
    ],
    teeth: ["First tooth", "First molar", "All baby teeth"],
    social: ["First smile", "Waved bye", "Clapped", "Gave a hug", "Played with a friend"],
    other: ["First solid food", "First haircut", "First trip to the sea", "First day at nursery"],
  },
};
