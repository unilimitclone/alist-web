import { useFetch, useT, useRouter, useManageTitle } from "~/hooks"
import { Group, SettingItem, PResp, PEmptyResp, EmptyResp } from "~/types"
import { r, notify, getTarget, handleResp } from "~/utils"
import { createStore } from "solid-js/store"
import { Button, HStack, VStack } from "@hope-ui/solid"
import { createSignal, Index, createMemo } from "solid-js"
import { Item } from "./SettingItem"
import { ResponsiveGrid } from "../common/ResponsiveGrid"

export interface CommonSettingsProps {
  group: Group
}
const buildSettingsPayload = (settings: SettingItem[]) => {
  const target = getTarget(settings) as SettingItem[]
  const allowRegister = target.find((item) => item.key === "allow_register")

  if (allowRegister?.value !== "true") {
    return target.filter((item) => item.key !== "default_role")
  }

  return target
}

const CommonSettings = (props: CommonSettingsProps) => {
  const t = useT()
  const { pathname } = useRouter()
  useManageTitle(`manage.sidemenu.${pathname().split("/").pop()}`)
  const [settingsLoading, getSettings] = useFetch(
    (): PResp<SettingItem[]> =>
      r.get(`/admin/setting/list?group=${props.group}`),
  )
  const [settings, setSettings] = createStore<SettingItem[]>([])
  const refresh = async () => {
    const resp = await getSettings()
    handleResp(resp, setSettings)
  }
  refresh()
  const [saveLoading, saveSettings] = useFetch(
    (): PEmptyResp =>
      r.post("/admin/setting/save", buildSettingsPayload(settings)),
  )
  const [loading, setLoading] = createSignal(false)

  // 对设置项进行排序，将 use_newui 放在 allow_indexed 之后
  const sortedSettings = createMemo(() => {
    const settingsArray = [...settings]
    const allowIndexedIndex = settingsArray.findIndex(
      (item) => item.key === "allow_indexed",
    )
    const useNewuiIndex = settingsArray.findIndex(
      (item) => item.key === "use_newui",
    )

    if (allowIndexedIndex !== -1 && useNewuiIndex !== -1) {
      // 如果 use_newui 在 allow_indexed 之前，需要重新排序
      if (useNewuiIndex < allowIndexedIndex) {
        const useNewuiItem = settingsArray.splice(useNewuiIndex, 1)[0]
        // 将 use_newui 插入到 allow_indexed 之后
        settingsArray.splice(allowIndexedIndex, 0, useNewuiItem)
      } else if (useNewuiIndex > allowIndexedIndex + 1) {
        // 如果 use_newui 在 allow_indexed 之后但不是紧挨着，也需要调整
        const useNewuiItem = settingsArray.splice(useNewuiIndex, 1)[0]
        // 将 use_newui 插入到 allow_indexed 之后
        settingsArray.splice(allowIndexedIndex + 1, 0, useNewuiItem)
      }
    }

    return settingsArray
  })

  return (
    <VStack w="$full" alignItems="start" spacing="$2">
      <ResponsiveGrid>
        <Index each={sortedSettings()}>
          {(item, _) => (
            <Item
              {...item()}
              onChange={(val) => {
                setSettings((i) => item().key === i.key, "value", val)
              }}
              onDelete={async () => {
                setLoading(true)
                const resp: EmptyResp = await r.post(
                  `/admin/setting/delete?key=${item().key}`,
                )
                setLoading(false)
                handleResp(resp, () => {
                  notify.success(t("global.delete_success"))
                  refresh()
                })
              }}
            />
          )}
        </Index>
      </ResponsiveGrid>
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          onClick={refresh}
          loading={settingsLoading() || loading()}
        >
          {t("global.refresh")}
        </Button>
        <Button
          loading={saveLoading()}
          onClick={async () => {
            const resp = await saveSettings()
            handleResp(resp, () => notify.success(t("global.save_success")))
          }}
        >
          {t("global.save")}
        </Button>
      </HStack>
    </VStack>
  )
}

export default CommonSettings
