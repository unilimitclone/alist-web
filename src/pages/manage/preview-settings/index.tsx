import {
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
} from "@hope-ui/solid"
import { createMemo, createSignal, For } from "solid-js"
import { useManageTitle, useT } from "~/hooks"
import { getPreviewSettings } from "~/store"
import { notify } from "~/utils"
import { ExtensionPicker, useExtensionList } from "./ExtensionPicker"
import { PreviewRow } from "./PreviewRow"
import {
  buildRowsForExtension,
  copyExtensionConfigTo,
  deleteIframeEntry,
  previewSettingsVersion,
  reorderRow,
  toggleRow,
  upsertIframeEntry,
} from "./store"

interface EditDraft {
  name: string
  url: string
  originalName?: string
}

const PreviewSettings = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.preview-settings")
  const [ext, setExt] = createSignal("pdf")
  const [userExts, setUserExts] = createSignal<string[]>([])
  const [editing, setEditing] = createSignal<EditDraft | null>(null)
  const [copying, setCopying] = createSignal(false)
  const [copyTargets, setCopyTargets] = createSignal<Set<string>>(new Set())
  const extList = useExtensionList(userExts)
  const toggleTarget = (e: string) => {
    const next = new Set(copyTargets())
    if (next.has(e)) next.delete(e)
    else next.add(e)
    setCopyTargets(next)
  }

  const rows = createMemo(() => {
    previewSettingsVersion()
    return buildRowsForExtension(ext(), getPreviewSettings()[ext()])
  })

  const reportError = (e: unknown) =>
    notify.error(e instanceof Error ? e.message : String(e))

  const openAdd = () => setEditing({ name: "", url: "" })
  const openEdit = (name: string, url?: string) =>
    setEditing({ name, url: url ?? "", originalName: name })

  const saveEdit = async () => {
    const draft = editing()
    if (!draft) return
    const cleanName = draft.name.trim()
    const cleanUrl = draft.url.trim()
    if (!cleanName || !cleanUrl) return
    try {
      await upsertIframeEntry(ext(), cleanName, cleanUrl, draft.originalName)
      setEditing(null)
    } catch (e) {
      reportError(e)
    }
  }

  return (
    <VStack w="$full" alignItems="stretch" spacing="$4">
      <Heading size="lg">{t("manage.sidemenu.preview-settings")}</Heading>
      <HStack w="$full" spacing="$2" alignItems="center">
        <ExtensionPicker
          value={ext()}
          onChange={setExt}
          extraKeys={userExts}
          onAdd={(e) => {
            if (!userExts().includes(e)) setUserExts([...userExts(), e])
            setExt(e)
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setCopyTargets(new Set())
            setCopying(true)
          }}
        >
          {t("preview_settings.copy_to_extensions")}
        </Button>
      </HStack>
      <VStack w="$full" alignItems="stretch" spacing="$2">
        <For each={rows()}>
          {(row, i) => (
            <PreviewRow
              row={row}
              onToggle={(next) =>
                toggleRow(ext(), row.id, next).catch(reportError)
              }
              onMoveUp={() => reorderRow(ext(), row.id, -1).catch(reportError)}
              onMoveDown={() => reorderRow(ext(), row.id, 1).catch(reportError)}
              onEdit={() => openEdit(row.name, row.url)}
              onDelete={() =>
                deleteIframeEntry(ext(), row.name).catch(reportError)
              }
              isFirst={i() === 0}
              isLast={i() === rows().length - 1}
            />
          )}
        </For>
      </VStack>
      <HStack>
        <Button size="sm" onClick={openAdd}>
          {t("preview_settings.add_iframe")}
        </Button>
      </HStack>

      <Modal opened={!!editing()} onClose={() => setEditing(null)}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t("preview_settings.add_iframe")}</ModalHeader>
          <ModalBody>
            <VStack alignItems="stretch" spacing="$3">
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={editing()?.name ?? ""}
                  onInput={(e) => {
                    const cur = editing()
                    if (cur) setEditing({ ...cur, name: e.currentTarget.value })
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>URL</FormLabel>
                <Input
                  value={editing()?.url ?? ""}
                  onInput={(e) => {
                    const cur = editing()
                    if (cur) setEditing({ ...cur, url: e.currentTarget.value })
                  }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={saveEdit}>{t("global.save")}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal opened={copying()} onClose={() => setCopying(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>{t("preview_settings.copy_to_extensions")}</ModalHeader>
          <ModalBody>
            <VStack
              alignItems="start"
              spacing="$1"
              maxH="50vh"
              overflowY="auto"
            >
              <For each={extList().filter((e) => e !== ext())}>
                {(e) => (
                  <Checkbox
                    checked={copyTargets().has(e)}
                    onChange={() => toggleTarget(e)}
                  >
                    {e}
                  </Checkbox>
                )}
              </For>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={async () => {
                const targets = Array.from(copyTargets())
                if (targets.length === 0) {
                  setCopying(false)
                  return
                }
                try {
                  await copyExtensionConfigTo(ext(), targets)
                  setCopying(false)
                } catch (e) {
                  reportError(e)
                }
              }}
            >
              {t("global.ok")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default PreviewSettings
