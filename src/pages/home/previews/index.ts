import { Component, lazy } from "solid-js"
import {
  getIframePreviews,
  me,
  getSettingBool,
  getPreviewSettings,
} from "~/store"
import { Obj, ObjType, UserMethods, UserPermissions } from "~/types"
import { ext } from "~/utils"
import { generateIframePreview } from "./iframe"
import { useRouter } from "~/hooks"
import { isArchive } from "~/store/archive"

type Ext = string[] | "*" | ((name: string) => boolean)
type Prior = boolean | (() => boolean)
const shareIncompatiblePreviewNames = new Set([
  "Aliyun Video Previewer",
  "Doubao Preview",
  "Aliyun Office Previewer",
  "Archive Preview",
])

const extsContains = (exts: Ext | undefined, name: string): boolean => {
  if (exts === undefined) {
    return false
  } else if (exts === "*") {
    return true
  } else if (typeof exts === "function") {
    return (exts as (name: string) => boolean)(name)
  } else {
    return (exts as string[]).includes(ext(name).toLowerCase())
  }
}

const isPrior = (p: Prior): boolean => {
  if (typeof p === "boolean") {
    return p
  }
  return p()
}

export interface Preview {
  key: string
  name: string
  i18nKey?: string
  type?: ObjType
  exts?: Ext
  provider?: RegExp
  enabled?: (file: PreviewFile) => boolean
  component: Component
  prior: Prior
}

export type PreviewComponent = Pick<Preview, "name" | "i18nKey" | "component">
type PreviewFile = Obj & {
  provider: string
  download_url?: string
  web_proxy?: boolean
}

const larkCloudDocExts = [
  "lark-doc",
  "lark-docx",
  "lark-sheet",
  "lark-bitable",
  "lark-mindnote",
  "lark-slides",
]

const isLarkCloudDoc = (name: string) =>
  larkCloudDocExts.includes(ext(name).toLowerCase())

const previews: Preview[] = [
  {
    key: "lark_preview",
    name: "Lark Preview",
    i18nKey: "home.preview.lark_preview",
    exts: "*",
    provider: /^Lark$/,
    enabled: (file) => !file.web_proxy || isLarkCloudDoc(file.name),
    component: lazy(() => import("./lark")),
    prior: true,
  },
  {
    key: "lark_tools",
    name: "Lark Tools",
    i18nKey: "home.preview.lark_tools.title",
    exts: ["lark-doc", "lark-docx", "lark-sheet", "lark-bitable"],
    provider: /^Lark$/,
    component: lazy(() => import("./lark_tools")),
    prior: true,
  },
  {
    key: "html",
    name: "HTML render",
    exts: ["html"],
    component: lazy(() => import("./html")),
    prior: true,
  },
  {
    key: "aliyun_video",
    name: "Aliyun Video Previewer",
    type: ObjType.VIDEO,
    provider: /^Aliyundrive(Open)?$/,
    component: lazy(() => import("./aliyun_video")),
    prior: true,
  },
  {
    key: "doubao",
    name: "Doubao Preview",
    exts: ["pdf"],
    provider: /^DoubaoNew$/,
    component: lazy(() => import("./doubao")),
    prior: true,
  },
  {
    key: "markdown",
    name: "Markdown",
    type: ObjType.TEXT,
    component: lazy(() => import("./markdown")),
    prior: true,
  },
  {
    key: "markdown_word_wrap",
    name: "Markdown with word wrap",
    type: ObjType.TEXT,
    component: lazy(() => import("./markdown_with_word_wrap")),
    prior: true,
  },
  {
    key: "url_open",
    name: "Url Open",
    exts: ["url"],
    component: lazy(() => import("./url")),
    prior: true,
  },
  {
    key: "text_editor",
    name: "Text Editor",
    type: ObjType.TEXT,
    exts: ["url"],
    component: lazy(() => import("./text-editor")),
    prior: true,
  },
  {
    key: "image",
    name: "Image",
    type: ObjType.IMAGE,
    component: lazy(() => import("./image")),
    prior: true,
  },
  {
    key: "video",
    name: "Video",
    type: ObjType.VIDEO,
    component: lazy(() => import("./video")),
    prior: true,
  },
  {
    key: "audio",
    name: "Audio",
    type: ObjType.AUDIO,
    component: lazy(() => import("./audio")),
    prior: true,
  },
  {
    key: "ipa",
    name: "Ipa",
    exts: ["ipa", "tipa"],
    component: lazy(() => import("./ipa")),
    prior: true,
  },
  {
    key: "plist",
    name: "Plist",
    exts: ["plist"],
    component: lazy(() => import("./plist")),
    prior: true,
  },
  {
    key: "aliyun_office",
    name: "Aliyun Office Previewer",
    exts: ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "pdf"],
    provider: /^Aliyundrive(Share)?$/,
    component: lazy(() => import("./aliyun_office")),
    prior: true,
  },
  {
    key: "asciinema",
    name: "Asciinema",
    exts: ["cast"],
    component: lazy(() => import("./asciinema")),
    prior: true,
  },
  {
    key: "video360",
    name: "Video360",
    type: ObjType.VIDEO,
    component: lazy(() => import("./video360")),
    prior: true,
  },
  {
    key: "archive",
    name: "Archive Preview",
    exts: (name: string) => {
      const index = UserPermissions.findIndex(
        (item) => item === "read_archives",
      )
      if (!UserMethods.can(me(), index)) return false
      return isArchive(name)
    },
    component: lazy(() => import("./archive")),
    prior: () => getSettingBool("preview_archives_by_default"),
  },
]

export const getPreviews = (file: PreviewFile): PreviewComponent[] => {
  const { pathname, searchParams } = useRouter()
  const typeOverride =
    ObjType[searchParams["type"]?.toUpperCase() as keyof typeof ObjType]
  const isShareRoute = pathname().startsWith("/s/")
  const fileExt = ext(file.name).toLowerCase()
  const override = getPreviewSettings()[fileExt]
  const disabled = new Set(override?.disabled ?? [])
  const orderList = override?.order ?? []
  const orderIndex = new Map<string, number>()
  orderList.forEach((id, i) => orderIndex.set(id, i))

  type Candidate = PreviewComponent & { id: string; defaultRank: number }
  const candidates: Candidate[] = []

  previews.forEach((preview, idx) => {
    if (isShareRoute && shareIncompatiblePreviewNames.has(preview.name)) return
    if (preview.provider && !preview.provider.test(file.provider)) return
    if (preview.enabled && !preview.enabled(file)) return
    if (
      !(
        preview.type === file.type ||
        (typeOverride && preview.type === typeOverride) ||
        extsContains(preview.exts, file.name)
      )
    ) {
      return
    }
    const id = `builtin:${preview.key}`
    if (disabled.has(id)) return
    const isExplicitlyOrdered = orderIndex.has(id)
    const rank =
      !isPrior(preview.prior) && !isExplicitlyOrdered ? 10000 + idx : idx
    candidates.push({
      id,
      name: preview.name,
      i18nKey: preview.i18nKey,
      component: preview.component,
      defaultRank: rank,
    })
  })

  const iframePreviews = getIframePreviews(file.name)
  iframePreviews.forEach((preview, i) => {
    const id = `iframe:${preview.key}`
    if (disabled.has(id)) return
    candidates.push({
      id,
      name: preview.key,
      component: generateIframePreview(preview.value),
      defaultRank: 1000 + i,
    })
  })

  candidates.sort((a, b) => {
    const ai = orderIndex.has(a.id)
      ? orderIndex.get(a.id)!
      : Number.MAX_SAFE_INTEGER
    const bi = orderIndex.has(b.id)
      ? orderIndex.get(b.id)!
      : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    return a.defaultRank - b.defaultRank
  })

  const res: PreviewComponent[] = candidates.map(
    ({ id, defaultRank, ...rest }) => rest,
  )

  if (!isShareRoute || file.download_url) {
    res.push({
      name: "Download",
      i18nKey: "home.preview.download",
      component: lazy(() => import("./download")),
    })
  }
  return res
}

export const getBuiltinPreviewRegistry = (): readonly Readonly<Preview>[] =>
  previews
