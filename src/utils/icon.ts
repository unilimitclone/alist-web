import {
  BsFileEarmarkWordFill,
  BsFileEarmarkExcelFill,
  BsFileEarmarkPptFill,
  BsFileEarmarkPdfFill,
  BsFileEarmarkPlayFill,
  BsFileEarmarkMusicFill,
  BsFileEarmarkFontFill,
  BsFileEarmarkImageFill,
  BsFileEarmarkMinusFill,
  BsApple,
  BsWindows,
  BsFileEarmarkZipFill,
  BsMarkdownFill,
} from "solid-icons/bs"
import {
  FaSolidDatabase,
  FaSolidBook,
  FaSolidCompactDisc,
  FaSolidLink,
} from "solid-icons/fa"
import { IoFolder } from "solid-icons/io"
import { ImAndroid } from "solid-icons/im"
import { Obj, ObjType } from "~/types"
import { ext } from "./path"
import {
  VscodeIconsFileTypeAi2,
  VscodeIconsFileTypePhotoshop2,
} from "~/components"
import { SiAsciinema } from "solid-icons/si"
import { isArchive } from "~/store/archive"
import { IconProps, IconTemplate } from "solid-icons/lib"
import { getSetting } from "~/store/settings"

// 通用自定义图标组件
export function createCustomIcon(imagePath: string, fallbackIcon: any) {
  return (props: IconProps) => {
    // 检查是否启用了新UI
    const useNewUI = getSetting("use_newui") === "true"

    if (useNewUI) {
      // 使用自定义图片图标
      return IconTemplate(
        {
          a: {
            viewBox: "0 0 32 32",
          },
          c: `<image href="${imagePath}" width="32" height="32" />`,
        },
        props,
      )
    } else {
      // 当 use_newui 为 false 时，使用备用图标
      return fallbackIcon(props)
    }
  }
}

// 自定义图标配置类型
interface CustomIconConfig {
  imagePath: string
  fallbackIcon: any
}

// 自定义图标管理器
class CustomIconManager {
  private customIcons: Map<string, CustomIconConfig> = new Map()

  // 注册自定义图标
  register(extension: string, config: CustomIconConfig) {
    this.customIcons.set(extension.toLowerCase(), config)
  }

  // 获取自定义图标组件
  getIcon(extension: string) {
    const config = this.customIcons.get(extension.toLowerCase())
    if (config) {
      return createCustomIcon(config.imagePath, config.fallbackIcon)
    }
    return null
  }

  // 检查是否有自定义图标
  hasCustomIcon(extension: string) {
    return this.customIcons.has(extension.toLowerCase())
  }

  // 获取所有已注册的扩展名
  getRegisteredExtensions() {
    return Array.from(this.customIcons.keys())
  }
}

// 创建全局图标管理器实例
export const customIconManager = new CustomIconManager()

// 注册默认的自定义图标
customIconManager.register("pdf", {
  imagePath: "/images/filetypes/PDF.png",
  fallbackIcon: BsFileEarmarkPdfFill,
})

// 便捷的注册函数
export function registerCustomIcon(
  extension: string,
  imagePath: string,
  fallbackIcon: any,
) {
  customIconManager.register(extension, { imagePath, fallbackIcon })
}

// 示例：如何注册更多自定义图标
// registerCustomIcon("doc", "/images/filetypes/DOC.png", BsFileEarmarkWordFill)
// registerCustomIcon("docx", "/images/filetypes/DOCX.png", BsFileEarmarkWordFill)
// registerCustomIcon("xls", "/images/filetypes/XLS.png", BsFileEarmarkExcelFill)
// registerCustomIcon("xlsx", "/images/filetypes/XLSX.png", BsFileEarmarkExcelFill)
// registerCustomIcon("ppt", "/images/filetypes/PPT.png", BsFileEarmarkPptFill)
// registerCustomIcon("pptx", "/images/filetypes/PPTX.png", BsFileEarmarkPptFill)

const iconMap = {
  "dmg,ipa,plist,tipa": BsApple,
  "exe,msi": BsWindows,
  apk: ImAndroid,
  db: FaSolidDatabase,
  md: BsMarkdownFill,
  epub: FaSolidBook,
  iso: FaSolidCompactDisc,
  m3u8: BsFileEarmarkPlayFill,
  "doc,docx": BsFileEarmarkWordFill,
  "xls,xlsx": BsFileEarmarkExcelFill,
  "ppt,pptx": BsFileEarmarkPptFill,
  pdf: BsFileEarmarkPdfFill, // 恢复为原始图标，让自定义逻辑在 getIconByTypeAndName 中处理
  psd: VscodeIconsFileTypePhotoshop2,
  ai: VscodeIconsFileTypeAi2,
  url: FaSolidLink,
  cast: SiAsciinema,
}

export const getIconByTypeAndName = (type: number, name: string) => {
  if (type !== ObjType.FOLDER) {
    // 首先检查是否有自定义图标
    const fileExtension = ext(name).toLowerCase()
    const customIcon = customIconManager.getIcon(fileExtension)
    if (customIcon) {
      return customIcon
    }

    // 然后检查 iconMap
    for (const [extensions, icon] of Object.entries(iconMap)) {
      if (extensions.split(",").includes(fileExtension)) {
        return icon
      }
    }
    if (isArchive(name)) {
      return BsFileEarmarkZipFill
    }
  }
  switch (type) {
    case ObjType.FOLDER:
      return IoFolder
    case ObjType.VIDEO:
      return BsFileEarmarkPlayFill
    case ObjType.AUDIO:
      return BsFileEarmarkMusicFill
    case ObjType.TEXT:
      return BsFileEarmarkFontFill
    case ObjType.IMAGE:
      return BsFileEarmarkImageFill
    default:
      return BsFileEarmarkMinusFill
  }
}

export const getIconByObj = (obj: Pick<Obj, "type" | "name">) => {
  return getIconByTypeAndName(obj.type, obj.name)
}
