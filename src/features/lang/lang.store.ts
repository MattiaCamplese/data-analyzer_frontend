import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Lang } from "@/lib/i18n"

interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "it",
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === "it" ? "en" : "it" }),
    }),
    { name: "da-lang" },
  ),
)
