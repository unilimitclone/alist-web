import { Button, HStack, Icon, Switch, Tag, Text, VStack } from "@hope-ui/solid"
import { Show } from "solid-js"
import { TbArrowDown, TbArrowUp } from "solid-icons/tb"
import { useT } from "~/hooks"
import type { PreviewRow as RowData } from "./store"

const displayName = (
  row: RowData,
  t: (
    key: string,
    params?: Record<string, string>,
    defaultValue?: string,
  ) => string,
): string => {
  if (row.source === "builtin" && row.builtinKey) {
    return t(`preview_settings.builtin.${row.builtinKey}`, undefined, row.name)
  }
  return row.name
}

export const PreviewRow = (props: {
  row: RowData
  onToggle: (next: boolean) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
}) => {
  const t = useT()
  return (
    <HStack
      w="$full"
      spacing="$3"
      p="$3"
      rounded="$md"
      bg="$neutral2"
      alignItems="start"
    >
      <VStack spacing="$1">
        <Button
          size="xs"
          variant="ghost"
          disabled={props.isFirst}
          onClick={props.onMoveUp}
          aria-label="move up"
        >
          <Icon as={TbArrowUp} />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          disabled={props.isLast}
          onClick={props.onMoveDown}
          aria-label="move down"
        >
          <Icon as={TbArrowDown} />
        </Button>
      </VStack>
      <Switch
        checked={props.row.enabled}
        onChange={(e: any) => props.onToggle(e.currentTarget.checked)}
      />
      <VStack alignItems="start" spacing="$1" flex="1">
        <HStack spacing="$2">
          <Text fontWeight="$medium">{displayName(props.row, t)}</Text>
          <Tag size="sm">
            {t(`preview_settings.source.${props.row.source}`)}
          </Tag>
          <Show when={props.row.provider}>
            <Tag size="sm" colorScheme="info">
              {props.row.provider}
            </Tag>
          </Show>
        </HStack>
        <Show when={props.row.url}>
          <Text size="sm" color="$neutral11" wordBreak="break-all">
            {props.row.url}
          </Text>
        </Show>
        <Show when={props.row.source === "iframe"}>
          <HStack spacing="$2" mt="$1">
            <Button size="xs" onClick={props.onEdit}>
              {t("global.edit")}
            </Button>
            <Button
              size="xs"
              colorScheme="danger"
              variant="outline"
              onClick={props.onDelete}
            >
              {t("global.delete")}
            </Button>
          </HStack>
        </Show>
      </VStack>
    </HStack>
  )
}
