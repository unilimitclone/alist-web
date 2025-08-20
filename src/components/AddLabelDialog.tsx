import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  VStack,
  notificationService,
  HStack,
  Box,
  Text,
  Divider,
  Tooltip,
  Heading,
} from "@hope-ui/solid"
import { createSignal, createEffect, For } from "solid-js"
import { useT } from "~/hooks"
import { createLabel, updateLabel, getFilesByLabel } from "~/utils/api"
import { bus, handleResp } from "~/utils"
import { StoreObj, Obj } from "~/types"

const LABEL_COLORS = ["#ff776e", "#feb34a", "#62e56f", "#4e9cff", "#d17bff"]

export interface AddLabelDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, description: string, bg_color: string) => void
  editingLabel?: {
    id: number
    name: string
    description: string
    bg_color: string
  } | null
}

const AddLabelDialog = (props: AddLabelDialogProps) => {
  const t = useT()
  const [name, setName] = createSignal("")
  const [description, setDescription] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [selectedColor, setSelectedColor] = createSignal(LABEL_COLORS[0])
  const [relatedFiles, setRelatedFiles] = createSignal<(StoreObj & Obj)[]>([])

  createEffect(() => {
    if (props.editingLabel) {
      setName(props.editingLabel.name)
      setDescription(props.editingLabel.description || "")
      setSelectedColor(props.editingLabel.bg_color)
      // 获取关联文件
      getFilesByLabel(props.editingLabel.id).then((resp) => {
        handleResp(resp, (data) => {
          setRelatedFiles(data || [])
        })
      })
    } else {
      setName("")
      setDescription("")
      setSelectedColor(LABEL_COLORS[0])
      setRelatedFiles([])
    }
  })

  const handleSubmit = async () => {
    if (!name()) {
      notificationService.show({
        title: t("home.tag.name"),
        description: t("home.tag.name_required"),
        status: "warning",
      })
      return
    }
    try {
      setLoading(true)
      if (props.editingLabel) {
        await updateLabel(
          props.editingLabel.id,
          name(),
          description(),
          selectedColor(),
        )
      } else {
        await createLabel(name(), description(), selectedColor())
      }
      props.onSubmit(name(), description(), selectedColor())
      setName("")
      setDescription("")
      props.onClose()
      bus.emit("refresh_labels")
      notificationService.show({
        title: t("home.tag.name"),
        description: props.editingLabel
          ? t("home.tag.update_success")
          : t("home.tag.create_success"),
        status: "success",
      })
    } catch (err: any) {
      notificationService.show({
        title: t("home.tag.name"),
        description:
          err.message ||
          (props.editingLabel
            ? t("home.tag.update_failed")
            : t("home.tag.create_failed")),
        status: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal opened={props.isOpen} onClose={props.onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          {props.editingLabel ? t("home.tag.edit") : t("home.tag.add")}
        </ModalHeader>
        <ModalBody>
          <VStack spacing="$3">
            <FormControl required>
              <FormLabel>{t("home.tag.name")}</FormLabel>
              <Input
                placeholder={t("home.tag.name")}
                value={name()}
                maxLength={10}
                onInput={(e) => setName(e.currentTarget.value)}
              />
              <FormHelperText pl="$1">{name().length}/10</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>{t("home.tag.description")}</FormLabel>
              <Input
                placeholder={t("home.tag.description")}
                value={description()}
                onChange={(e) => setDescription(e.currentTarget.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t("home.tag.color")}</FormLabel>
              <HStack spacing="$4" justifyContent="start">
                {LABEL_COLORS.map((color) => (
                  <Box
                    as="button"
                    type="button"
                    w="$7"
                    h="$7"
                    rounded="$full"
                    bgColor={color}
                    cursor="pointer"
                    border={
                      selectedColor() === color ? "3px solid $neutral8" : "none"
                    }
                    _hover={{
                      transform: "scale(1.1)",
                    }}
                    transition="all 0.2s"
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </HStack>
            </FormControl>
            <Divider />
            <FormControl>
              {/* <FormLabel>{t("home.tag.related_files")}</FormLabel> */}
              <Heading mb="$4">{t("home.tag.related_files")}</Heading>
              <VStack spacing="$2" alignItems="stretch">
                <For each={relatedFiles()}>
                  {(file) => (
                    <HStack
                      p="$4"
                      bg="$neutral3"
                      rounded="$md"
                      spacing="$2"
                      overflow="hidden"
                      alignItems="center"
                    >
                      <Text flex="2" fontSize="$md" noOfLines={1}>
                        {file.name}
                      </Text>
                      <Tooltip label={file.path} placement="top">
                        <Text
                          flex="3"
                          fontSize="$sm"
                          color="$neutral11"
                          noOfLines={1}
                          css={{
                            direction: "rtl",
                            textAlign: "left",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.path}
                        </Text>
                      </Tooltip>
                    </HStack>
                  )}
                </For>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="primary" onClick={props.onClose} mr="$2">
            {t("global.cancel")}
          </Button>
          <Button onClick={handleSubmit} loading={loading()}>
            {t("global.confirm")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default AddLabelDialog
