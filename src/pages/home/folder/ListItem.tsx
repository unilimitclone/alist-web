import { HStack, Icon, Text, Badge, Tooltip } from "@hope-ui/solid"
import { Motion } from "@motionone/solid"
import { useContextMenu } from "solid-contextmenu"
import {
  batch,
  Show,
  For,
  createSignal,
  onMount,
  onCleanup,
  createMemo,
} from "solid-js"
import { LinkWithPush } from "~/components"
import { usePath, useRouter, useUtil, useT } from "~/hooks"
import {
  checkboxOpen,
  getMainColor,
  local,
  OrderBy,
  selectIndex,
  selectedObjs,
} from "~/store"
import { ObjType, StoreObj, Obj } from "~/types"
import { bus, formatDate, getFileSize, hoverColor } from "~/utils"
import { getIconByObj } from "~/utils/icon"
import { ItemCheckbox, useSelectWithMouse } from "./helper"
import { UserMethods } from "~/types"
import { me } from "~/store"
import { getColorWithOpacity } from "~/utils/color"
import { pathJoin } from "~/utils/path"

interface Label {
  id: number
  name: string
  type: number
  description: string
  bg_color: string
}

export interface Col {
  name: OrderBy | "tag"
  textAlign: "left" | "right"
  w: any
}

export const cols: Col[] = [
  { name: "name", textAlign: "left", w: { "@initial": "60%", "@md": "45%" } },
  { name: "size", textAlign: "right", w: { "@initial": "40%", "@md": "30%" } },
  { name: "modified", textAlign: "right", w: { "@initial": 0, "@md": "25%" } },
]

// 添加选中统计组件
const SelectionStats = () => {
  const selected = selectedObjs
  const totalSize = createMemo(() => {
    return selected().reduce<number>((acc, obj) => acc + (obj.size || 0), 0)
  })
  const t = useT()
  return (
    <Show when={selected().length > 0}>
      <HStack
        spacing="$2"
        position="fixed"
        top="$4"
        right="$4"
        transform="none"
        bgColor={getMainColor()}
        color="white"
        p="$2"
        rounded="$lg"
        zIndex="$banner"
        shadow="$md"
      >
        <Text>
          {t("home.selected")} {selected().length} {t("home.selected_count")}
        </Text>
        <Text>
          {t("home.total_size")} {getFileSize(totalSize())}
        </Text>
      </HStack>
    </Show>
  )
}

export const ListItem = (props: { obj: StoreObj & Obj; index: number }) => {
  const { isHide } = useUtil()
  const { refresh } = usePath()
  if (isHide(props.obj)) {
    return null
  }
  const { setPathAs } = usePath()
  const { show } = useContextMenu({ id: 1 })
  const { pushHref, to, pathname } = useRouter()
  const { openWithDoubleClick, toggleWithClick, restoreSelectionCache } =
    useSelectWithMouse()
  const filenameStyle = () => local["list_item_filename_overflow"]

  // 构建完整路径
  const getFullPath = () => {
    // 如果obj.path存在且是完整路径（以权限路径开头），直接使用
    const userPermissions = me().permissions || []

    // if (
    //   props.obj.path &&
    //   userPermissions.some((perm) => props.obj.path?.startsWith(perm.path))
    // ) {
    //   return props.obj.path
    // }
    // 否则使用当前路径

    return pathJoin(pathname(), props.obj.name)
  }

  return (
    <>
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: "100%",
        }}
      >
        <HStack
          classList={{ selected: !!props.obj.selected }}
          class="list-item viselect-item"
          data-index={props.index}
          w="$full"
          p="$2"
          rounded="$lg"
          transition="all 0.3s"
          _hover={{
            transform: "scale(1.01)",
            backgroundColor: hoverColor(),
          }}
          bgColor={props.obj.selected ? hoverColor() : undefined}
        >
          <HStack
            class="name-box"
            spacing="$1"
            w={cols[0].w}
            as={LinkWithPush}
            href={props.obj.name}
            cursor={
              openWithDoubleClick() || toggleWithClick() ? "default" : "pointer"
            }
            on:dblclick={() => {
              if (!openWithDoubleClick()) return
              selectIndex(props.index, true, true)
              to(getFullPath())
            }}
            on:click={(e: MouseEvent) => {
              e.preventDefault()
              if (openWithDoubleClick()) return
              if (e.ctrlKey || e.metaKey || e.shiftKey) return
              if (!restoreSelectionCache()) return
              if (toggleWithClick())
                return selectIndex(props.index, !props.obj.selected)
              to(getFullPath())
            }}
            onMouseEnter={() => {
              setPathAs(props.obj.name, props.obj.is_dir, true)
            }}
            onContextMenu={(e: MouseEvent) => {
              batch(() => {
                selectIndex(props.index, true, true)
              })
              show(e, { props: props.obj })
            }}
          >
            <Show when={checkboxOpen()}>
              <ItemCheckbox
                on:mousedown={(e: MouseEvent) => {
                  e.stopPropagation()
                }}
                on:click={(e: MouseEvent) => {
                  e.stopPropagation()
                }}
                checked={props.obj.selected}
                onChange={(e: any) => {
                  selectIndex(props.index, e.target.checked)
                }}
              />
            </Show>
            <Icon
              class="icon"
              boxSize="$6"
              color={getMainColor()}
              as={getIconByObj(props.obj)}
              mr="$1"
              cursor={props.obj.type !== ObjType.IMAGE ? "inherit" : "pointer"}
              on:click={(e: MouseEvent) => {
                if (props.obj.type !== ObjType.IMAGE) return
                if (e.ctrlKey || e.metaKey || e.shiftKey) return
                if (!restoreSelectionCache()) return
                bus.emit("gallery", props.obj.name)
                e.preventDefault()
                e.stopPropagation()
              }}
            />
            <Text
              class="name"
              css={{
                position: "relative",
                whiteSpace: "nowrap",
                overflow: "hidden",
                flex: 1,
                minWidth: 0,
                cursor: "pointer",
              }}
              title={props.obj.name}
            >
              <div
                ref={(el) => {
                  if (el) {
                    onMount(() => {
                      const checkWidth = () => {
                        const parent = el.parentElement
                        if (parent && el.scrollWidth > parent.clientWidth) {
                          el.classList.add("should-marquee")
                        } else {
                          el.classList.remove("should-marquee")
                        }
                      }
                      checkWidth()
                      // 监听窗口大小变化，重新检查是否需要滚动
                      window.addEventListener("resize", checkWidth)
                      onCleanup(() => {
                        window.removeEventListener("resize", checkWidth)
                      })
                    })
                  }
                }}
                style={{
                  display: "inline-block",
                  "white-space": "nowrap",
                  "padding-right": "50px",
                }}
              >
                {props.obj.name}
              </div>
              <style>
                {`
                .should-marquee:hover {
                  animation: marquee 8s linear infinite;
                }
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(calc(-100% + ${cols[0].w["@initial"]})); }
                }
                `}
              </style>
            </Text>
          </HStack>
          <HStack
            spacing="$0_5"
            justifyContent="flex-start"
            overflow="hidden"
            w="8%"
          >
            <Show when={props.obj.label_list?.length}>
              <For each={props.obj.label_list || []}>
                {(label: Label) => (
                  <Tooltip label={label.name} placement="top">
                    <Badge
                      colorScheme="primary"
                      bgColor={getColorWithOpacity(label.bg_color)}
                      color={label.bg_color}
                      variant="solid"
                      mr="$0_5"
                      textTransform="none"
                      maxW="80px"
                      overflow="hidden"
                      css={{
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.75rem",
                        paddingInline: "0.5rem",
                        paddingBlock: "0.25rem",
                      }}
                    >
                      {label.name}
                    </Badge>
                  </Tooltip>
                )}
              </For>
            </Show>
          </HStack>
          <Text class="size" w={cols[2].w} textAlign={cols[2].textAlign as any}>
            {getFileSize(props.obj.size)}
          </Text>
          <Text
            class="modified"
            display={{ "@initial": "none", "@md": "inline" }}
            w={cols[2].w}
            textAlign={cols[2].textAlign as any}
          >
            {formatDate(props.obj.modified)}
          </Text>
        </HStack>
      </Motion.div>
      <SelectionStats />
    </>
  )
}
