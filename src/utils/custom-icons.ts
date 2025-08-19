// 自定义图标配置文件
// 这个文件用于注册所有自定义图标
// 只包含 public/images/filetypes/ 目录中实际存在的图标文件

import {
  BsFileEarmarkWordFill,
  BsFileEarmarkExcelFill,
  BsFileEarmarkPptFill,
  BsFileEarmarkPdfFill,
  BsFileEarmarkZipFill,
  BsFileEarmarkImageFill,
  BsFileEarmarkPlayFill,
  BsFileEarmarkMusicFill,
  BsFileEarmarkFontFill,
  BsFileEarmarkMinusFill,
  BsMarkdownFill,
  BsApple,
  BsWindows,
} from "solid-icons/bs"
import { FaSolidDatabase, FaSolidBook } from "solid-icons/fa"
import { registerCustomIcon } from "./icon"

// 注册所有自定义图标
// 格式：registerCustomIcon(文件扩展名, 图片路径, 备用图标)

// Office 文档
registerCustomIcon("doc", "/images/filetypes/DOC.png", BsFileEarmarkWordFill)
registerCustomIcon("docx", "/images/filetypes/DOCX.png", BsFileEarmarkWordFill)
registerCustomIcon("xls", "/images/filetypes/XLS.png", BsFileEarmarkExcelFill)
registerCustomIcon("xlsx", "/images/filetypes/XLSX.png", BsFileEarmarkExcelFill)
registerCustomIcon("ppt", "/images/filetypes/PPT.png", BsFileEarmarkPptFill)
registerCustomIcon("pptx", "/images/filetypes/PPTX.png", BsFileEarmarkPptFill)
registerCustomIcon("pdf", "/images/filetypes/PDF.png", BsFileEarmarkPdfFill)
registerCustomIcon("wps", "/images/filetypes/WPS.png", BsFileEarmarkWordFill)

// 压缩文件
registerCustomIcon("zip", "/images/filetypes/ZIP.png", BsFileEarmarkZipFill)
registerCustomIcon("rar", "/images/filetypes/rar.png", BsFileEarmarkZipFill)
registerCustomIcon("7z", "/images/filetypes/7z.png", BsFileEarmarkZipFill)
registerCustomIcon("gz", "/images/filetypes/GZ.png", BsFileEarmarkZipFill)
registerCustomIcon("tar", "/images/filetypes/TAR.png", BsFileEarmarkZipFill)

// 图片文件
registerCustomIcon("jpg", "/images/filetypes/JPG.png", BsFileEarmarkImageFill)
registerCustomIcon("jpeg", "/images/filetypes/JPEG.png", BsFileEarmarkImageFill)
registerCustomIcon("png", "/images/filetypes/PNG.png", BsFileEarmarkImageFill)
registerCustomIcon("gif", "/images/filetypes/GIF.png", BsFileEarmarkImageFill)
registerCustomIcon("bmp", "/images/filetypes/BMP.png", BsFileEarmarkImageFill)
registerCustomIcon("svg", "/images/filetypes/SVG.png", BsFileEarmarkImageFill)
registerCustomIcon("ico", "/images/filetypes/ICO.png", BsFileEarmarkImageFill)
registerCustomIcon("tif", "/images/filetypes/TIF.png", BsFileEarmarkImageFill)
registerCustomIcon("tiff", "/images/filetypes/TIFF.png", BsFileEarmarkImageFill)
registerCustomIcon("psd", "/images/filetypes/PSD.png", BsFileEarmarkImageFill)
registerCustomIcon("ai", "/images/filetypes/AI.png", BsFileEarmarkImageFill)

// 视频文件
registerCustomIcon("mp4", "/images/filetypes/MP4.png", BsFileEarmarkPlayFill)
registerCustomIcon("avi", "/images/filetypes/AVI.png", BsFileEarmarkPlayFill)
registerCustomIcon("mov", "/images/filetypes/MOV.png", BsFileEarmarkPlayFill)
registerCustomIcon("wmv", "/images/filetypes/WMV.png", BsFileEarmarkPlayFill)
registerCustomIcon("3gp", "/images/filetypes/3GP.png", BsFileEarmarkPlayFill)
registerCustomIcon("mpg", "/images/filetypes/MPG.png", BsFileEarmarkPlayFill)
registerCustomIcon("rm", "/images/filetypes/RM.png", BsFileEarmarkPlayFill)
registerCustomIcon("rmvb", "/images/filetypes/RMVB.png", BsFileEarmarkPlayFill)

// 音频文件
registerCustomIcon("mp3", "/images/filetypes/MP3.png", BsFileEarmarkMusicFill)
registerCustomIcon("wav", "/images/filetypes/WAV.png", BsFileEarmarkMusicFill)
registerCustomIcon("flac", "/images/filetypes/FLAC.png", BsFileEarmarkMusicFill)
registerCustomIcon("aac", "/images/filetypes/AAC.png", BsFileEarmarkMusicFill)
registerCustomIcon("wma", "/images/filetypes/WMA.png", BsFileEarmarkMusicFill)
registerCustomIcon("aif", "/images/filetypes/aif.png", BsFileEarmarkMusicFill)
registerCustomIcon("au", "/images/filetypes/AU.png", BsFileEarmarkMusicFill)
registerCustomIcon("amr", "/images/filetypes/AMR.png", BsFileEarmarkMusicFill)
registerCustomIcon("mmf", "/images/filetypes/MMF.png", BsFileEarmarkMusicFill)

// 文本文件
registerCustomIcon("txt", "/images/filetypes/TXT.png", BsFileEarmarkFontFill)
registerCustomIcon("json", "/images/filetypes/JSON.png", BsFileEarmarkFontFill)
registerCustomIcon("xml", "/images/filetypes/XML.png", BsFileEarmarkFontFill)
registerCustomIcon("csv", "/images/filetypes/CSV.png", BsFileEarmarkFontFill)
registerCustomIcon("sql", "/images/filetypes/SQL.png", BsFileEarmarkFontFill)
registerCustomIcon("srt", "/images/filetypes/SRT.png", BsFileEarmarkFontFill)

// 代码文件
registerCustomIcon("html", "/images/filetypes/html.png", BsFileEarmarkFontFill)
registerCustomIcon("htm", "/images/filetypes/htm.png", BsFileEarmarkFontFill)
registerCustomIcon("css", "/images/filetypes/CSS.png", BsFileEarmarkFontFill)
registerCustomIcon("php", "/images/filetypes/PHP.png", BsFileEarmarkFontFill)
registerCustomIcon("py", "/images/filetypes/PY.png", BsFileEarmarkFontFill)
registerCustomIcon("java", "/images/filetypes/JAVA.png", BsFileEarmarkFontFill)
registerCustomIcon("cpp", "/images/filetypes/CPP.png", BsFileEarmarkFontFill)
registerCustomIcon("asp", "/images/filetypes/ASP.png", BsFileEarmarkFontFill)
registerCustomIcon("aspx", "/images/filetypes/ASPX.png", BsFileEarmarkFontFill)
registerCustomIcon("cfm", "/images/filetypes/CFM.png", BsFileEarmarkFontFill)
registerCustomIcon("cgi", "/images/filetypes/CGI.png", BsFileEarmarkFontFill)

// 其他文件类型
registerCustomIcon("iso", "/images/filetypes/ISO.png", BsFileEarmarkMinusFill)
registerCustomIcon("dmg", "/images/filetypes/DMG.png", BsApple)
registerCustomIcon("exe", "/images/filetypes/exe.png", BsWindows)
registerCustomIcon("msi", "/images/filetypes/MSI.png", BsWindows)
registerCustomIcon("apk", "/images/filetypes/apk.png", BsFileEarmarkMinusFill)
registerCustomIcon("ipa", "/images/filetypes/ipa.png", BsApple)
registerCustomIcon("tipa", "/images/filetypes/tipa.png", BsApple)
registerCustomIcon("pkg", "/images/filetypes/PKG.png", BsFileEarmarkMinusFill)
registerCustomIcon("com", "/images/filetypes/COM.png", BsFileEarmarkMinusFill)
registerCustomIcon("cad", "/images/filetypes/CAD.png", BsFileEarmarkMinusFill)
registerCustomIcon("obj", "/images/filetypes/OBJ.png", BsFileEarmarkMinusFill)
registerCustomIcon("mdf", "/images/filetypes/MDF.png", BsFileEarmarkMinusFill)
registerCustomIcon("otf", "/images/filetypes/OTF.png", BsFileEarmarkFontFill)
registerCustomIcon("rat", "/images/filetypes/rat.png", BsFileEarmarkMinusFill)

// 使用说明：
// 1. 所有图标文件都存在于 public/images/filetypes/ 目录中
// 2. 只有在用户开启了 use_newui 设置时，才会显示自定义图标
// 3. 如果自定义图标加载失败，会自动回退到备用图标
// 4. 可以通过修改 getSetting("use_newui") 的值来控制是否启用自定义图标

// 如何添加新的自定义图标：
// 1. 将图标文件放在 public/images/filetypes/ 目录中
// 2. 在下面添加一行 registerCustomIcon 调用
// 3. 指定正确的文件扩展名、图片路径和备用图标

// 示例：
// registerCustomIcon("新扩展名", "/images/filetypes/新图标.png", 备用图标组件)
