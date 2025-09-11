import {
  Badge,
  Box,
  Button,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@hope-ui/solid"
import { createSignal, For, onMount, createMemo, Show } from "solid-js"
import {
  useFetch,
  useListFetch,
  useManageTitle,
  useRouter,
  useT,
} from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import {
  UserPermissions,
  User,
  UserMethods,
  PPageResp,
  PEmptyResp,
} from "~/types"
import { DeletePopover } from "../common/DeletePopover"
import { Wether } from "~/components"
import { getRoleList } from "~/utils/api"

const Role = (props: { role: number[]; roleMap: Record<number, string> }) => {
  const getBadgeColor = (roleId: number) => {
    switch (roleId) {
      case 1: // 访客
        return "neutral"
      case 2: // 管理员
        return "success"
      default:
        return "info"
    }
  }

  return (
    <HStack spacing="$1">
      <For each={props.role}>
        {(role) => (
          <Badge colorScheme={getBadgeColor(role)}>
            {props.roleMap[role] ?? role}
          </Badge>
        )}
      </For>
    </HStack>
  )
}

const Permissions = (props: { user: User }) => {
  const t = useT()
  const color = (can: boolean) => `$${can ? "success" : "danger"}9`
  return (
    <HStack spacing="$0_5">
      <For each={UserPermissions}>
        {(item, i) => (
          <Tooltip label={t(`users.permissions.${item}`)}>
            <Box
              boxSize="$2"
              rounded="$full"
              bg={color(UserMethods.can(props.user, i()))}
            ></Box>
          </Tooltip>
        )}
      </For>
    </HStack>
  )
}

const Users = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.users")
  const { to } = useRouter()

  // 获取用户列表
  const [getUsersLoading, getUsers] = useFetch(
    (): PPageResp<User> => r.get("/admin/user/list"),
  )
  const [users, setUsers] = createSignal<User[]>([])
  const refresh = async () => {
    const resp = await getUsers()
    handleResp(resp, (data) => setUsers(data.content))
  }

  const [roleList, setRoleList] = createSignal<{ id: number; name: string }[]>(
    [],
  )
  const roleMap = createMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const r of roleList()) map[r.id] = r.name
    return map
  })

  const loadRolesOnce = async () => {
    const resp = await getRoleList()
    handleResp(resp, (data) => setRoleList(data.content))
  }

  onMount(() => {
    loadRolesOnce()
    refresh()
  })

  // 操作按钮
  const [deleting, deleteUser] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/delete?id=${id}`),
  )
  const [cancel_2faId, cancel_2fa] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/cancel_2fa?id=${id}`),
  )

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          loading={getUsersLoading()}
          onClick={refresh}
        >
          {t("global.refresh")}
        </Button>
        <Button
          onClick={() => {
            to("/@manage/users/add")
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For each={["username", "role", "available"]}>
                {(title) => <Th>{t(`users.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={users()}>
              {(user) => (
                <Tr>
                  <Td>{user.username}</Td>
                  <Td>
                    <Show
                      when={Object.keys(roleMap()).length > 0}
                      fallback={<Badge>...</Badge>}
                    >
                      <Role role={user.role} roleMap={roleMap()} />
                    </Show>
                  </Td>
                  <Td>
                    <Wether yes={!user.disabled} />
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        onClick={() => {
                          to(`/@manage/users/edit/${user.id}`)
                        }}
                      >
                        {t("global.edit")}
                      </Button>
                      <DeletePopover
                        name={user.username}
                        loading={deleting() === user.id}
                        onClick={async () => {
                          const resp = await deleteUser(user.id)
                          handleResp(resp, () => {
                            notify.success(t("global.delete_success"))
                            refresh()
                          })
                        }}
                      />
                      <Button
                        colorScheme="accent"
                        loading={cancel_2faId() === user.id}
                        onClick={async () => {
                          const resp = await cancel_2fa(user.id)
                          handleResp(resp, () => {
                            notify.success(t("users.cancel_2fa_success"))
                            refresh()
                          })
                        }}
                      >
                        {t("users.cancel_2fa")}
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default Users
