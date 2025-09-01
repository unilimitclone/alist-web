import axios, { Canceler } from "axios"
import {
  appendObjs,
  password,
  ObjStore,
  State,
  getPagination,
  objStore,
  getHistoryKey,
  hasHistory,
  recoverHistory,
  clearHistory,
  me,
} from "~/store"
import {
  fsGet,
  fsList,
  handleRespWithoutNotify,
  log,
  notify,
  pathJoin,
} from "~/utils"
import { useFetch } from "./useFetch"
import { useRouter } from "./useRouter"

let first_fetch = true

let cancelObj: Canceler
let cancelList: Canceler

const IsDirRecord: Record<string, boolean> = {}
let globalPage = 1
export const getGlobalPage = () => {
  return globalPage
}
export const setGlobalPage = (page: number) => {
  globalPage = page
  // console.log("setGlobalPage", globalPage)
}
export const resetGlobalPage = () => {
  setGlobalPage(1)
}
export const usePath = () => {
  const { pathname, to, searchParams } = useRouter()

  // 统一的路径处理函数
  const getProcessedPath = (path: string): string => {
    if (path === "/") return "/"
    // 如果路径已经包含了权限路径，直接返回

    const userPermissions = me().permissions || []
    for (const perm of userPermissions) {
      if (path.startsWith(perm.path)) {
        return path
      }
    }

    // 查找最匹配的权限路径
    let bestMatch = userPermissions[0]
    let maxMatchLength = 0

    for (const perm of userPermissions) {
      const cleanPath = path.replace(/^\/|\/$/g, "")
      const cleanPermPath = perm.path.replace(/^\/|\/$/g, "")

      if (
        cleanPath.includes(cleanPermPath) &&
        cleanPermPath.length > maxMatchLength
      ) {
        bestMatch = perm
        maxMatchLength = cleanPermPath.length
      }
    }

    // 如果找到匹配的权限路径，返回完整路径
    if (bestMatch && maxMatchLength > 0) {
      return pathJoin(bestMatch.path, path)
    }

    // 如果没有找到匹配，使用第一个权限路径
    if (userPermissions.length > 0) {
      return pathJoin(userPermissions[0].path, path)
    }

    return path
  }

  const [, getObj] = useFetch((path: string) =>
    fsGet(
      path,
      password(),
      new axios.CancelToken((c) => {
        cancelObj = c
      }),
    ),
  )
  const pagination = getPagination()
  if (pagination.type === "pagination") {
    setGlobalPage(parseInt(searchParams["page"]) || 1)
  }
  const [, getObjs] = useFetch(
    (arg?: {
      path: string
      index?: number
      size?: number
      force?: boolean
    }) => {
      const page = {
        index: arg?.index,
        size: arg?.size,
      }
      const processedPath = getProcessedPath(arg?.path || "/")

      return fsList(
        processedPath,
        password(),
        page.index,
        page.size,
        arg?.force,
        new axios.CancelToken((c) => {
          cancelList = c
        }),
      )
    },
  )
  // set a path must be a dir
  const setPathAs = (path: string, dir = true, push = false) => {
    if (push) {
      path = pathJoin(pathname(), path)
    }
    if (dir) {
      IsDirRecord[path] = true
    } else {
      delete IsDirRecord[path]
    }
  }

  // record is second time password is wrong
  let retry_pass = false
  // handle pathname change
  // if confirm current path is dir, fetch List directly
  // if not, fetch get then determine if it is dir or file
  const handlePathChange = (
    path: string,
    index?: number,
    rp?: boolean,
    force?: boolean,
  ) => {
    retry_pass = rp ?? false
    ObjStore.setErr("")

    if (first_fetch) {
      first_fetch = false
    }

    const userPermissions = me().permissions || []
    if (path === "/") {
      // 如果有权限路径是"/"，直接获取文件列表
      if (userPermissions.some((perm) => perm.path === "/")) {
        return handleFolder("/", index, undefined, undefined, force)
      }
      // 否则显示权限目录列表
      if (userPermissions.length > 0) {
        const permDirs = userPermissions.map((perm) => ({
          name: perm.path.split("/").filter(Boolean).pop() || perm.path,
          size: 0,
          is_dir: true,
          modified: new Date().toISOString(),
          created: new Date().toISOString(),
          sign: "",
          thumb: "",
          type: 1, // FOLDER
          path: perm.path,
          selected: false,
        }))

        ObjStore.setObjs(permDirs)
        ObjStore.setTotal(permDirs.length)
        ObjStore.setState(State.Folder)
      } else {
        ObjStore.setState(State.Initial)
      }
      return Promise.resolve()
    }

    if (hasHistory(path, index)) {
      return recoverHistory(path, index)
    }

    // 检查路径是否已知为目录
    if (IsDirRecord[path]) {
      return handleFolder(path, index, undefined, undefined, force)
    }

    // 如果不知道是文件还是目录，先调用fsget接口判断
    return handleObj(path, index)
  }

  // handle enter obj that don't know if it is dir or file
  const handleObj = async (path: string, index?: number) => {
    ObjStore.setState(State.FetchingObj)
    const resp = await getObj(path)
    handleRespWithoutNotify(
      resp,
      (data) => {
        ObjStore.setObj(data)
        ObjStore.setProvider(data.provider)
        if (data.is_dir) {
          setPathAs(path)
          handleFolder(path, index)
        } else {
          ObjStore.setReadme(data.readme)
          ObjStore.setHeader(data.header)
          ObjStore.setRelated(data.related ?? [])
          ObjStore.setRawUrl(data.raw_url)
          ObjStore.setState(State.File)
        }
      },
      handleErr,
    )
  }

  // change enter a folder or turn page or load more
  const handleFolder = async (
    path: string,
    index?: number,
    size?: number,
    append = false,
    force?: boolean,
  ) => {
    if (!size) {
      size = pagination.size
    }
    if (size !== undefined && pagination.type === "all") {
      size = undefined
    }
    ObjStore.setState(append ? State.FetchingMore : State.FetchingObjs)
    const resp = await getObjs({ path, index, size, force })
    handleRespWithoutNotify(
      resp,
      (data) => {
        setGlobalPage(index ?? 1)
        if (append) {
          appendObjs(data.content)
        } else {
          ObjStore.setObjs(data.content ?? [])
          ObjStore.setTotal(data.total)
        }
        ObjStore.setReadme(data.readme)
        ObjStore.setHeader(data.header)
        ObjStore.setWrite(data.write)
        ObjStore.setProvider(data.provider)
        // 设置路径为目录
        setPathAs(path)
        ObjStore.setState(State.Folder)
      },
      handleErr,
    )
  }

  const handleErr = (msg: string, code?: number) => {
    const currentPath = pathname()
    const userPermissions = me().permissions || []
    // 如果是403权限错误，返回到根目录并显示权限目录
    if (code === 403) {
      if (currentPath === "/" || userPermissions.length === 0) {
        const permDirs = userPermissions.map((perm) => ({
          name: perm.path.split("/").filter(Boolean).pop() || perm.path,
          size: 0,
          is_dir: true,
          modified: new Date().toISOString(),
          created: new Date().toISOString(),
          sign: "",
          thumb: "",
          type: 1, // FOLDER
          path: perm.path,
          selected: false,
        }))

        ObjStore.setObjs(permDirs)
        ObjStore.setTotal(permDirs.length)
        ObjStore.setState(State.Folder)
        to("/")
      } else {
        ObjStore.setState(State.NeedPassword)
      }
      return
    }

    // 如果是存储未找到错误
    if (
      msg.includes("storage not found") ||
      msg.includes("please add a storage")
    ) {
      ObjStore.setErr(msg)
      ObjStore.setState(State.Initial)
      return
    }

    // 如果是根路径访问，显示所有权限目录
    if (currentPath === "/") {
      if (userPermissions.length > 0) {
        const permDirs = userPermissions.map((perm) => ({
          name: perm.path.split("/").filter(Boolean).pop() || perm.path,
          size: 0,
          is_dir: true,
          modified: new Date().toISOString(),
          created: new Date().toISOString(),
          sign: "",
          thumb: "",
          type: 1, // FOLDER
          path: perm.path,
          selected: false,
        }))

        ObjStore.setObjs(permDirs)
        ObjStore.setTotal(permDirs.length)
        ObjStore.setState(State.Folder)
        return
      }
    } else {
      // 检查当前路径是否是某个权限路径的子路径
      const matchedPerm = userPermissions.find((perm) => {
        // 移除开头的斜杠以便比较
        const cleanCurrentPath = currentPath.replace(/^\//, "")
        const cleanPermPath = perm.path.replace(/^\//, "")
        return (
          cleanCurrentPath.includes(cleanPermPath) ||
          cleanPermPath.includes(cleanCurrentPath)
        )
      })

      // 如果找到匹配的权限路径，重定向到正确的完整路径
      if (matchedPerm) {
        const pathParts = currentPath.split("/").filter(Boolean)
        const permParts = matchedPerm.path.split("/").filter(Boolean)

        // 如果当前路径是权限路径的一部分，重定向到完整的权限路径
        if (pathParts.some((part) => permParts.includes(part))) {
          to(matchedPerm.path)
          return
        }
      }
    }
    ObjStore.setErr(msg)
    ObjStore.setState(State.Initial)
  }

  const loadMore = () => {
    return handleFolder(pathname(), globalPage + 1, undefined, true)
  }
  return {
    handlePathChange: handlePathChange,
    setPathAs: setPathAs,
    refresh: async (retry_pass?: boolean, force?: boolean) => {
      const path = pathname()
      const scroll = window.scrollY
      clearHistory(path, globalPage)
      if (
        pagination.type === "load_more" ||
        pagination.type === "auto_load_more"
      ) {
        const page = globalPage
        resetGlobalPage()
        await handlePathChange(path, globalPage, retry_pass, force)
        while (globalPage < page) {
          await loadMore()
        }
      } else {
        await handlePathChange(path, globalPage, retry_pass, force)
      }
      window.scroll({ top: scroll, behavior: "smooth" })
    },
    loadMore: loadMore,
    allLoaded: () => globalPage >= Math.ceil(objStore.total / pagination.size),
  }
}
