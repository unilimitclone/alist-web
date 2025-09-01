export interface SystemInfo {
  os: string
  browser: string
  device: string
}

export function parseUserAgent(ua: string): SystemInfo {
  const uaLower = ua.toLowerCase()

  // 操作系统检测
  let os = "Unknown"
  if (uaLower.includes("windows")) {
    os = "Windows"
  } else if (uaLower.includes("macintosh") || uaLower.includes("mac os")) {
    os = "macOS"
  } else if (uaLower.includes("linux")) {
    os = "Linux"
  } else if (uaLower.includes("android")) {
    os = "Android"
  } else if (
    uaLower.includes("ios") ||
    uaLower.includes("iphone") ||
    uaLower.includes("ipad")
  ) {
    os = "iOS"
  }

  // 浏览器检测
  let browser = "Unknown"
  if (uaLower.includes("chrome")) {
    browser = "Chrome"
  } else if (uaLower.includes("firefox")) {
    browser = "Firefox"
  } else if (uaLower.includes("safari") && !uaLower.includes("chrome")) {
    browser = "Safari"
  } else if (uaLower.includes("edge")) {
    browser = "Edge"
  } else if (uaLower.includes("opera")) {
    browser = "Opera"
  }

  // 设备类型检测
  let device = "Desktop"
  if (uaLower.includes("mobile")) {
    device = "Mobile"
  } else if (uaLower.includes("tablet") || uaLower.includes("ipad")) {
    device = "Tablet"
  }

  return { os, browser, device }
}

export function getSystemDisplayName(ua: string): string {
  const { os, browser, device } = parseUserAgent(ua)

  // 根据设备类型返回不同的显示格式
  if (device === "Mobile" || device === "Tablet") {
    return `${os} ${device}`
  }

  return `${os} ${browser}`
}
