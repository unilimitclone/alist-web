import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Button,
  VStack,
  HStack,
  Box,
  FormControl,
  FormLabel,
  Select,
  SelectTrigger,
  SelectPlaceholder,
  SelectValue,
  SelectContent,
  SelectOption,
  SelectOptionText,
  SelectOptionIndicator,
  Tag,
  TagLabel,
  TagCloseButton,
  createDisclosure,
  Checkbox,
  Icon,
} from "@hope-ui/solid"
import { createSignal, For, Show, createEffect } from "solid-js"
import { useT, useRouter, usePath } from "~/hooks"
import { IoCheckmark } from "solid-icons/io"
import { BsPlus } from "solid-icons/bs"
import {
  createLabelFileBinding,
  createLabelFileBindingBatch,
} from "~/utils/api"
import { handleResp, notify } from "~/utils"
import { StoreObj, Obj } from "~/types"

interface Label {
  id: number
  name: string
  type: number
  description: string
  bg_color: string
}

export interface EditLabelDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (selectedLabels: string[]) => void
  labels: Label[]
  obj: StoreObj
  isBatch?: boolean
  selectedObjs?: StoreObj[]
}

const EditLabelDialog = (props: EditLabelDialogProps) => {
  const t = useT()
  const { to } = useRouter()
  const { refresh } = usePath()
  const [selectedLabelIds, setSelectedLabelIds] = createSignal<string[]>([])
  const [loading, setLoading] = createSignal(false)

  const initializeSelectedLabels = () => {
    if (props.isOpen && props.obj.label_list?.length) {
      setSelectedLabelIds(
        props.obj.label_list.map((label) => label.id.toString()),
      )
    } else {
      setSelectedLabelIds([])
    }
  }

  createEffect(() => {
    if (props.isOpen) {
      initializeSelectedLabels()
    }
  })

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const labelIdsString = selectedLabelIds().join(",")

      // 调用批量打标签接口
      const objectsToProcess =
        props.isBatch && props.selectedObjs ? props.selectedObjs : [props.obj]
      const resp = await createLabelFileBindingBatch(
        labelIdsString,
        objectsToProcess,
      )

      handleResp(resp, () => {
        notify.success(t("home.tag.bind_success"))
        props.onSubmit(selectedLabelIds())
        props.onClose()
        // 延迟刷新，等待对话框关闭完成
        setTimeout(() => {
          refresh(false, false)
        }, 300)
      })
    } catch (err: any) {
      notify.error(err.message || t("home.tag.bind_failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleNewTag = () => {
    props.onClose()
    to("/@manage/settings/tag")
  }

  const handleSelect = (id: string) => {
    const current = selectedLabelIds()
    if (current.includes(id)) {
      setSelectedLabelIds(current.filter((labelId) => labelId !== id))
    } else {
      setSelectedLabelIds([...current, id])
    }
  }

  const removeLabel = (id: string) => {
    setSelectedLabelIds(selectedLabelIds().filter((labelId) => labelId !== id))
  }

  const getLabelNameById = (id: string) => {
    return props.labels.find((label) => label.id.toString() === id)?.name || ""
  }

  return (
    <Modal opened={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{t("home.tag.tag")}</ModalHeader>
        <ModalBody>
          <VStack spacing="$3">
            <FormControl required>
              <FormLabel color="$neutral11">{t("home.tag.select")}</FormLabel>
              <Select
                multiple
                value={selectedLabelIds()}
                onChange={setSelectedLabelIds}
              >
                <SelectTrigger>
                  <Box
                    display="flex"
                    flexWrap="wrap"
                    gap="$2"
                    p="$2"
                    minH="40px"
                    alignItems="center"
                  >
                    <Show
                      when={selectedLabelIds().length > 0}
                      fallback={
                        <SelectPlaceholder>
                          {t("home.tag.select")}
                        </SelectPlaceholder>
                      }
                    >
                      <For each={selectedLabelIds().slice(0, 3)}>
                        {(labelId) => (
                          <Tag
                            size="lg"
                            variant="subtle"
                            bgColor="$neutral2"
                            rounded="$sm"
                            px="$3"
                            py="$1"
                          >
                            <TagLabel>{getLabelNameById(labelId)}</TagLabel>
                            <TagCloseButton
                              onClick={(e) => {
                                e.stopPropagation()
                                removeLabel(labelId)
                              }}
                            />
                          </Tag>
                        )}
                      </For>
                      <Show when={selectedLabelIds().length > 3}>
                        <Tag
                          size="lg"
                          variant="subtle"
                          bgColor="$neutral2"
                          rounded="$sm"
                          px="$3"
                          py="$1"
                        >
                          <TagLabel>+{selectedLabelIds().length - 3}</TagLabel>
                        </Tag>
                      </Show>
                    </Show>
                  </Box>
                </SelectTrigger>
                <SelectContent>
                  <For each={props.labels}>
                    {(label) => (
                      <SelectOption
                        value={label.id.toString()}
                        onClick={() => handleSelect(label.id.toString())}
                      >
                        <HStack spacing="$2" w="$full" pl="$4" fontSize="$lg">
                          <Checkbox
                            checked={selectedLabelIds().includes(
                              label.id.toString(),
                            )}
                            readOnly
                          />
                          <SelectOptionText>{label.name}</SelectOptionText>
                        </HStack>
                      </SelectOption>
                    )}
                  </For>
                </SelectContent>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing="$2" justifyContent="space-between" w="$full">
            <Button
              onClick={handleNewTag}
              leftIcon={<Icon as={BsPlus} boxSize="$5" />}
            >
              {t("home.tag.new")}
            </Button>
            <HStack spacing="$2">
              <Button colorScheme="primary" onClick={props.onClose}>
                {t("global.cancel")}
              </Button>
              <Button onClick={handleSubmit} loading={loading()}>
                {t("global.confirm")}
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default EditLabelDialog
