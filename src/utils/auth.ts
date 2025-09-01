import { changeToken } from "./request"

const EXCLUDE_KEYS = [
  "alist_client_id",
  "remember-pwd",
  "username",
  "password",
  "device_key",
] // 登出时不清除的 key

export function clearUserData() {
  // 保存需要保留的数据
  const preserved: Record<string, string> = {}
  EXCLUDE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key)
    if (value) {
      preserved[key] = value
    }
  })

  // 清除 token
  changeToken()

  // 清除所有 localStorage 数据
  localStorage.clear()

  // 恢复需要保留的数据
  Object.entries(preserved).forEach(([key, value]) => {
    localStorage.setItem(key, value)
  })

  // 清除所有 sessionStorage 数据
  sessionStorage.clear()
}
