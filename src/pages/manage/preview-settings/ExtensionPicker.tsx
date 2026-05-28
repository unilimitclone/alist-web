import {
  Button,
  HStack,
  Input,
  Select,
  SelectContent,
  SelectIcon,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectPlaceholder,
  SelectTrigger,
  SelectValue,
} from "@hope-ui/solid"
import { createMemo, createSignal, For, Show } from "solid-js"
import { getSetting } from "~/store"
import { useT } from "~/hooks"

const COMMON_EXTS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "html",
  "json",
  "log",
  "srt",
  "ass",
  "lrc",
  "vtt",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "mp3",
  "flac",
  "wav",
  "mp4",
  "mkv",
  "webm",
  "mov",
  "epub",
  "zip",
  "rar",
  "7z",
  "ipa",
  "plist",
]

const collectKeysFromRecord = (raw: string): string[] => {
  if (!raw) return []
  try {
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== "object") return []
    const out: string[] = []
    for (const k of Object.keys(obj)) {
      if (k.startsWith("/")) continue
      k.split(",").forEach((part) => {
        const t = part.trim().toLowerCase()
        if (t) out.push(t)
      })
    }
    return out
  } catch {
    return []
  }
}

export const useExtensionList = (extraKeys: () => string[]) =>
  createMemo(() => {
    const set = new Set<string>(COMMON_EXTS)
    collectKeysFromRecord(getSetting("iframe_previews")).forEach((k) =>
      set.add(k),
    )
    collectKeysFromRecord(getSetting("external_previews")).forEach((k) =>
      set.add(k),
    )
    extraKeys().forEach((k) => set.add(k.toLowerCase()))
    return Array.from(set).sort()
  })

export const ExtensionPicker = (props: {
  value: string
  onChange: (v: string) => void
  extraKeys: () => string[]
  onAdd: (ext: string) => void
}) => {
  const t = useT()
  const list = useExtensionList(props.extraKeys)
  const [adding, setAdding] = createSignal(false)
  const [draft, setDraft] = createSignal("")

  return (
    <HStack spacing="$2" w="$full">
      <Select value={props.value} onChange={props.onChange}>
        <SelectTrigger w="$48">
          <SelectPlaceholder>{t("global.choose")}</SelectPlaceholder>
          <SelectValue />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent>
          <SelectListbox>
            <For each={list()}>
              {(item) => (
                <SelectOption value={item}>
                  <SelectOptionText>{item}</SelectOptionText>
                  <SelectOptionIndicator />
                </SelectOption>
              )}
            </For>
          </SelectListbox>
        </SelectContent>
      </Select>
      <Show
        when={!adding()}
        fallback={
          <HStack spacing="$1">
            <Input
              size="sm"
              w="$32"
              placeholder="ext"
              value={draft()}
              onInput={(e) => setDraft(e.currentTarget.value)}
            />
            <Button
              size="sm"
              onClick={() => {
                const clean = draft().trim().replace(/^\./, "").toLowerCase()
                if (clean) props.onAdd(clean)
                setAdding(false)
                setDraft("")
              }}
            >
              {t("global.ok")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              {t("global.cancel")}
            </Button>
          </HStack>
        }
      >
        <Button size="sm" onClick={() => setAdding(true)}>
          {t("preview_settings.add_extension")}
        </Button>
      </Show>
    </HStack>
  )
}
