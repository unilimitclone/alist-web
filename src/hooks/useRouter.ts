import {
  NavigateOptions,
  SetParams,
  useLocation,
  useNavigate,
  useParams,
  _mergeSearchString,
} from "@solidjs/router"
import { createMemo, untrack } from "solid-js"
import { encodePath, joinBase, pathDir, pathJoin, trimBase } from "~/utils"
import { clearHistory } from "~/store"
import { me } from "~/store"

const useRouter = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const pathname = createMemo(() => {
    return trimBase(location.pathname)
  })
  return {
    to: (
      path: string,
      ignore_root?: boolean,
      options?: Partial<NavigateOptions>,
    ) => {
      if (!ignore_root && path.startsWith("/")) {
        path = joinBase(path)
      }
      clearHistory(decodeURIComponent(path))
      navigate(path, options)
    },
    replace: (to: string) => {
      const path = encodePath(pathJoin(pathDir(location.pathname), to), true)
      clearHistory(decodeURIComponent(path))
      navigate(path)
    },
    pushHref: (to: string): string => {
      // 获取用户权限路径
      const userPermissions = me().permissions || []
      const currentPath = pathname()

      // 检查当前路径是否直接来自权限列表
      const isPermissionPath = userPermissions.some(
        (perm) => perm.path === currentPath,
      )
      if (isPermissionPath) {
        // 如果当前路径是权限路径，直接在其基础上添加新路径
        return encodePath(pathJoin(currentPath, to))
      }

      // 检查当前路径是否在某个权限路径下
      const matchedPerm = userPermissions.find((perm) => {
        const cleanCurrentPath = currentPath.replace(/^\/|\/$/g, "")
        const cleanPermPath = perm.path.replace(/^\/|\/$/g, "")
        return cleanCurrentPath.startsWith(cleanPermPath)
      })

      // 如果找到匹配的权限路径，使用它作为基础路径
      if (matchedPerm) {
        return encodePath(pathJoin(matchedPerm.path, to))
      }

      // 如果没有找到匹配的权限路径，使用当前路径
      return encodePath(pathJoin(pathname(), to))
    },
    back: () => {
      navigate(-1)
    },
    forward: () => {
      navigate(1)
    },
    pathname: pathname,
    search: location.search,
    searchParams: location.query,
    setSearchParams: (
      params: SetParams,
      options?: Partial<NavigateOptions>,
    ) => {
      const searchString = untrack(() =>
        _mergeSearchString(location.search, params),
      )
      navigate(joinBase(pathname()) + searchString, {
        scroll: false,
        ...options,
        resolve: true,
      })
    },
    params: params,
  }
}

export { useRouter }
