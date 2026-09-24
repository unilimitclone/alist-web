import { createSignal, JSXElement, Match, onMount, Switch } from "solid-js"
import { Error, FullScreenLoading } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { Me, me, setMe } from "~/store"
import { clearAllHistory } from "~/store/history"
import { PResp } from "~/types"
import { r, handleResp } from "~/utils"

const getUserCacheKey = (user: Partial<Me>) =>
  JSON.stringify({
    id: user.id ?? 0,
    base_path: user.base_path ?? "",
    role: [...(user.role ?? [])].sort((a, b) => a - b),
    permissions: [...(user.permissions ?? [])]
      .map((perm) => `${perm.path}:${perm.permission}`)
      .sort(),
  })

const MustUser = (props: { children: JSXElement }) => {
  const t = useT()
  const { pathname } = useRouter()
  const [loading, data] = useFetch((): PResp<Me> => r.get("/me"), true)
  const [err, setErr] = createSignal<string>()

  onMount(() => {
    void (async () => {
      const resp = await data()
      // Opening the site without a valid session is a normal login flow.
      // Resource requests and explicit guest access still report errors.
      const notifyError = resp.code !== 401 || pathname() !== "/"
      handleResp(
        resp,
        (user) => {
          if (getUserCacheKey(user) !== getUserCacheKey(me())) {
            clearAllHistory()
          }
          setMe(user)
        },
        setErr,
        true,
        notifyError,
      )
    })()
  })

  return (
    <Switch fallback={props.children}>
      <Match when={loading()}>
        <FullScreenLoading />
      </Match>
      <Match when={err() !== undefined}>
        <Error msg={t("home.get_current_user_failed") + err()} />
      </Match>
    </Switch>
  )
}

export { MustUser }
