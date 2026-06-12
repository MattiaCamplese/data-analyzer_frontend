import { translations } from "@/lib/i18n"
import { useLangStore } from "@/features/lang/lang.store"

export function useT() {
  const lang = useLangStore((s) => s.lang)
  return translations[lang]
}
