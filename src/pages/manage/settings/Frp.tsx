import { Button, Heading, HStack, Text, Textarea } from "@hope-ui/solid"
import { createSignal, Index, onCleanup, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { MaybeLoading } from "~/components"
import { useFetch, useManageTitle, useT } from "~/hooks"
import { Group, PResp, SettingItem } from "~/types"
import { getTarget, handleResp, notify, r } from "~/utils"
import { ResponsiveGrid } from "../common/ResponsiveGrid"
import { Item } from "./SettingItem"

interface FRPRuntime {
  status: string
  logs: string[]
}

const POLL_INTERVAL_MS = 3000
const LOG_LIMIT = 200

const FrpSettings = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.frp")

  const [settings, setSettings] = createStore<SettingItem[]>([])
  const [status, setStatus] = createSignal("")
  const [logs, setLogs] = createSignal<string[]>([])

  const [loadingSettings, fetchSettings] = useFetch(
    (): PResp<SettingItem[]> => r.get(`/admin/setting/list?group=${Group.FRP}`),
  )
  const [, fetchRuntime] = useFetch(
    (): PResp<FRPRuntime> =>
      r.get(`/admin/setting/frp_runtime?limit=${LOG_LIMIT}`),
  )

  const refreshSettings = async () => {
    const resp = await fetchSettings()
    handleResp(resp, (data) => {
      setSettings(data.filter((i) => i.key !== "frp_status"))
    })
  }
  const refreshRuntimeInfo = async () => {
    const resp = await fetchRuntime()
    handleResp(resp, (data) => {
      setStatus(data.status || "")
      setLogs(data.logs || [])
    })
  }

  const refresh = async () => {
    await refreshSettings()
    await refreshRuntimeInfo()
  }
  refresh()
  const pollTimer = setInterval(refreshRuntimeInfo, POLL_INTERVAL_MS)
  onCleanup(() => clearInterval(pollTimer))

  const [applyLoading, applyFRP] = useFetch(
    (): PResp<string> =>
      r.post("/admin/setting/set_frp", getTarget(settings) as SettingItem[]),
  )
  const [stopLoading, stopFRP] = useFetch(
    (): PResp<string> => r.post("/admin/setting/stop_frp"),
  )

  return (
    <MaybeLoading loading={loadingSettings()}>
      <Heading mb="$4">{t("settings_other.frp")}</Heading>
      <HStack mb="$4" spacing="$4" alignItems="center">
        <Show when={status()}>
          <Text>
            {t("settings_other.frp_status_label")}{" "}
            <Text as="span" fontWeight="$bold">
              {status()}
            </Text>
          </Text>
        </Show>
        <Button variant="outline" onClick={refreshRuntimeInfo}>
          {t("settings_other.frp_refresh_status")}
        </Button>
      </HStack>
      <ResponsiveGrid>
        <Index each={settings}>
          {(item, i) => (
            <Item
              {...item()}
              onChange={(val) => {
                setSettings(i, "value", val)
              }}
            />
          )}
        </Index>
      </ResponsiveGrid>
      <HStack mt="$4" spacing="$4" alignItems="center">
        <Button
          loading={applyLoading()}
          onClick={async () => {
            const resp = await applyFRP()
            handleResp(resp, (data) => {
              setStatus(data)
              refreshRuntimeInfo()
              notify.success(t("settings_other.frp_apply_success"))
            })
          }}
        >
          {t("settings_other.frp_save_apply")}
        </Button>
        <Button
          loading={stopLoading()}
          colorScheme="danger"
          variant="outline"
          onClick={async () => {
            const resp = await stopFRP()
            handleResp(resp, (data) => {
              setStatus(data)
              refreshRuntimeInfo()
              notify.success(t("settings_other.frp_stop_success"))
            })
          }}
        >
          {t("settings_other.frp_stop")}
        </Button>
      </HStack>
      <Heading mt="$6" mb="$2" size="md">
        {t("settings_other.frp_logs")}
      </Heading>
      <Textarea
        value={
          logs().length ? logs().join("\n") : t("settings_other.frp_logs_empty")
        }
        readOnly
        rows={14}
        resize="vertical"
        css={{ fontFamily: "monospace" }}
      />
    </MaybeLoading>
  )
}

export default FrpSettings
