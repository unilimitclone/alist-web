import { i18n } from "~/app/i18n"

// 全局翻译函数，可以在非组件环境中使用
export const globalT = (
  key: string,
  params?: Record<string, string>,
  defaultValue?: string,
) => {
  const [t] = i18n
  const value = t(key, params, defaultValue)
  if (!value) {
    if (import.meta.env.DEV) return key
    let lastDotIndex = key.lastIndexOf(".")
    if (lastDotIndex === key.length - 1) {
      lastDotIndex = key.lastIndexOf(".", lastDotIndex - 1)
    }
    const last = key.slice(lastDotIndex + 1)
    return last.split("_").join(" ")
  }
  return value
}

// 获取当前语言
export const getCurrentLang = () => {
  const [, { locale }] = i18n
  return locale()
}

// 检查是否为中文
export const isChinese = () => {
  return getCurrentLang() === "zh"
}

// 根据语言返回不同的文本
export const getTextByLang = (zhText: string, enText: string) => {
  return isChinese() ? zhText : enText
}
