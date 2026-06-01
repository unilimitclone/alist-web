import { createSignal } from "solid-js"
import { getBuiltinPreviewRegistry, type Preview } from "~/pages/home/previews"
import {
  getPreviewSettings,
  getSetting,
  setSettings as setGlobalSettings,
  type PreviewSettingsMap,
} from "~/store"
import type { PreviewOverride } from "~/store/settings"
import { ObjType } from "~/types"
import {
  handleRespWithoutAuth,
  handleRespWithoutAuthAndNotify,
  r,
  recordToArray,
  strToRegExp,
} from "~/utils"

export type RowSource = "builtin" | "iframe" | "external"

export interface PreviewRow {
  id: string
  source: RowSource
  name: string
  builtinKey?: string
  provider?: string
  url?: string
  enabled: boolean
}

const parseRecord = (raw: string): Record<string, Record<string, string>> => {
  if (!raw) return {}
  try {
    const v = JSON.parse(raw)
    return v && typeof v === "object" ? v : {}
  } catch {
    return {}
  }
}

const matchesExtension = (groupKey: string, ext: string): boolean => {
  if (groupKey.startsWith("/")) {
    try {
      return strToRegExp(groupKey).test(ext)
    } catch {
      return false
    }
  }
  return groupKey
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(ext)
}

const typeSettingKey = (type?: ObjType): string | null => {
  if (type === undefined) return null
  switch (type) {
    case ObjType.VIDEO:
      return "video_types"
    case ObjType.AUDIO:
      return "audio_types"
    case ObjType.IMAGE:
      return "image_types"
    case ObjType.TEXT:
      return "text_types"
    default:
      return null
  }
}

const typeMatchesExtension = (
  type: ObjType | undefined,
  ext: string,
): boolean => {
  const key = typeSettingKey(type)
  if (!key) return false
  return getSetting(key)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(ext)
}

const builtinMatchesExtension = (
  p: Readonly<Preview>,
  ext: string,
): boolean => {
  if (p.exts) {
    if (p.exts === "*") return true
    if (typeof p.exts === "function") return p.exts(`x.${ext}`)
    if (
      (p.exts as readonly string[]).map((s) => s.toLowerCase()).includes(ext)
    ) {
      return true
    }
  }
  return typeMatchesExtension(p.type, ext)
}

export const buildRowsForExtension = (
  ext: string,
  override: PreviewOverride | undefined,
): PreviewRow[] => {
  const lowerExt = ext.toLowerCase()
  const disabled = new Set(override?.disabled ?? [])
  const orderList = override?.order ?? []
  const orderIndex = new Map<string, number>()
  orderList.forEach((id, i) => orderIndex.set(id, i))

  const rows: { row: PreviewRow; defaultRank: number }[] = []

  getBuiltinPreviewRegistry().forEach((p, idx) => {
    if (!builtinMatchesExtension(p, lowerExt)) return
    const id = `builtin:${p.key}`
    rows.push({
      row: {
        id,
        source: "builtin",
        name: p.name,
        builtinKey: p.key,
        provider: p.provider?.source,
        enabled: !disabled.has(id),
      },
      defaultRank: idx,
    })
  })

  const iframeMap = parseRecord(getSetting("iframe_previews"))
  let iframeRank = 0
  for (const groupKey of Object.keys(iframeMap)) {
    if (!matchesExtension(groupKey, lowerExt)) continue
    for (const { key, value } of recordToArray(iframeMap[groupKey])) {
      const id = `iframe:${key}`
      rows.push({
        row: {
          id,
          source: "iframe",
          name: key,
          url: value,
          enabled: !disabled.has(id),
        },
        defaultRank: 1000 + iframeRank++,
      })
    }
  }

  const externalMap = parseRecord(getSetting("external_previews"))
  let externalRank = 0
  for (const groupKey of Object.keys(externalMap)) {
    if (!matchesExtension(groupKey, lowerExt)) continue
    for (const { key, value } of recordToArray(externalMap[groupKey])) {
      const id = `external:${key}`
      rows.push({
        row: {
          id,
          source: "external",
          name: key,
          url: value,
          enabled: !disabled.has(id),
        },
        defaultRank: 2000 + externalRank++,
      })
    }
  }

  rows.sort((a, b) => {
    const ai = orderIndex.has(a.row.id)
      ? orderIndex.get(a.row.id)!
      : Number.MAX_SAFE_INTEGER
    const bi = orderIndex.has(b.row.id)
      ? orderIndex.get(b.row.id)!
      : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    return a.defaultRank - b.defaultRank
  })

  return rows.map((r) => r.row)
}

export const [previewSettingsVersion, bumpPreviewSettingsVersion] =
  createSignal(0)

const refreshSettings = async (): Promise<void> => {
  const resp = (await r.get("/public/settings")) as {
    code: number
    data: Record<string, string>
    message: string
  }
  handleRespWithoutAuthAndNotify(resp, (data) => {
    setGlobalSettings(data)
    bumpPreviewSettingsVersion((v) => v + 1)
  })
}

const normaliseOverride = (o: PreviewOverride): PreviewOverride | undefined => {
  const clean: PreviewOverride = {}
  if (o.order && o.order.length) clean.order = o.order
  if (o.disabled && o.disabled.length) clean.disabled = o.disabled
  return Object.keys(clean).length ? clean : undefined
}

export const updateOverride = async (
  ext: string,
  mutate: (current: PreviewOverride) => PreviewOverride,
): Promise<void> => {
  const lower = ext.toLowerCase()
  const current: PreviewSettingsMap = { ...getPreviewSettings() }
  const next = mutate({ ...(current[lower] ?? {}) })
  const normalised = normaliseOverride(next)
  if (normalised) {
    current[lower] = normalised
  } else {
    delete current[lower]
  }
  const value = JSON.stringify(current)
  await new Promise<void>((resolve, reject) => {
    r.post("/admin/setting/save", [
      { key: "preview_settings", value, type: "text", group: 3 },
    ]).then((resp: any) => {
      handleRespWithoutAuth(
        resp,
        () => {
          refreshSettings().then(resolve, reject)
        },
        (msg) => reject(new Error(msg)),
      )
    }, reject)
  })
}

export const toggleRow = (ext: string, id: string, nextEnabled: boolean) =>
  updateOverride(ext, (cur) => {
    const disabled = new Set(cur.disabled ?? [])
    if (nextEnabled) disabled.delete(id)
    else disabled.add(id)
    return { ...cur, disabled: Array.from(disabled) }
  })

const computeDefaultOrder = (ext: string): string[] =>
  buildRowsForExtension(ext, undefined).map((r) => r.id)

export const reorderRow = (
  ext: string,
  id: string,
  direction: -1 | 1,
): Promise<void> =>
  updateOverride(ext, (cur) => {
    const defaults = computeDefaultOrder(ext)
    const current =
      cur.order && cur.order.length ? [...cur.order] : [...defaults]
    for (const d of defaults) {
      if (!current.includes(d)) current.push(d)
    }
    const idx = current.indexOf(id)
    if (idx === -1) return cur
    const target = idx + direction
    if (target < 0 || target >= current.length) return cur
    ;[current[idx], current[target]] = [current[target], current[idx]]
    const equalsDefault =
      current.length === defaults.length &&
      current.every((v, i) => v === defaults[i])
    return { ...cur, order: equalsDefault ? [] : current }
  })

const writeIframeRegistry = async (
  next: Record<string, Record<string, string>>,
): Promise<void> => {
  const value = JSON.stringify(next)
  const resp = await r.post("/admin/setting/save", [
    { key: "iframe_previews", value, type: "text", group: 3 },
  ])
  await new Promise<void>((resolve, reject) => {
    handleRespWithoutAuth(
      resp,
      () => {
        refreshSettings().then(resolve, reject)
      },
      (msg) => reject(new Error(msg)),
    )
  })
}

const cloneRegistry = (): Record<string, Record<string, string>> => {
  try {
    const raw = getSetting("iframe_previews")
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const splitGroupForExtension = (
  registry: Record<string, Record<string, string>>,
  ext: string,
): void => {
  for (const groupKey of Object.keys(registry)) {
    if (groupKey === ext) continue
    if (groupKey.startsWith("/")) continue
    const members = groupKey
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    if (!members.includes(ext)) continue
    const remaining = members.filter((m) => m !== ext)
    const entries = registry[groupKey]
    delete registry[groupKey]
    if (remaining.length) {
      registry[remaining.join(",")] = { ...entries }
    }
    registry[ext] = { ...(registry[ext] ?? {}), ...entries }
  }
}

export const upsertIframeEntry = async (
  ext: string,
  name: string,
  url: string,
  originalName?: string,
): Promise<void> => {
  const reg = cloneRegistry()
  splitGroupForExtension(reg, ext)
  const bucket = reg[ext] ?? {}
  if (originalName && originalName !== name) {
    delete bucket[originalName]
  }
  bucket[name] = url
  reg[ext] = bucket
  await writeIframeRegistry(reg)
}

export const deleteIframeEntry = async (
  ext: string,
  name: string,
): Promise<void> => {
  const reg = cloneRegistry()
  splitGroupForExtension(reg, ext)
  if (reg[ext]) {
    delete reg[ext][name]
    if (Object.keys(reg[ext]).length === 0) {
      delete reg[ext]
    }
  }
  await writeIframeRegistry(reg)
  await updateOverride(ext, (cur) => {
    const id = `iframe:${name}`
    return {
      order: (cur.order ?? []).filter((x) => x !== id),
      disabled: (cur.disabled ?? []).filter((x) => x !== id),
    }
  })
}

export const copyExtensionConfigTo = async (
  srcExt: string,
  destExts: string[],
): Promise<void> => {
  if (destExts.length === 0) return
  const reg = cloneRegistry()
  splitGroupForExtension(reg, srcExt)
  const srcIframe = reg[srcExt] ?? {}
  for (const dest of destExts) {
    if (dest === srcExt) continue
    splitGroupForExtension(reg, dest)
    reg[dest] = { ...(reg[dest] ?? {}), ...srcIframe }
  }
  await writeIframeRegistry(reg)
  const srcOverride = getPreviewSettings()[srcExt]
  if (!srcOverride) return
  for (const dest of destExts) {
    if (dest === srcExt) continue
    await updateOverride(dest, () => ({
      order: srcOverride.order ? [...srcOverride.order] : undefined,
      disabled: srcOverride.disabled ? [...srcOverride.disabled] : undefined,
    }))
  }
}
