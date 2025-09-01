import { getMySession, evictMySession } from "~/utils/api"
import { useT, useRouter } from "~/hooks"
import { handleResp, notify, changeToken } from "~/utils"
import { clearUserData } from "~/utils/auth"
import { getSystemDisplayName } from "~/utils/ua-parser"
import { DeletePopover } from "../common/DeletePopover"
import {
  VStack,
  HStack,
  Button,
  Box,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@hope-ui/solid"
import { createSignal, For, onMount } from "solid-js"

const MySession = () => {
  const [sessions, setSessions] = createSignal<any[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [kickingSession, setKickingSession] = createSignal<string | null>(null)

  const t = useT()
  const { to } = useRouter()

  const handleKickOut = async (sessionId: string) => {
    setKickingSession(sessionId)
    try {
      const resp = await evictMySession(sessionId)
      handleResp(
        resp,
        () => {
          notify.success(t("session.kick_out_success"))
          fetchSessions()
        },
        (message, code) => {
          if (message?.includes("session inactive") || code === 403) {
            notify.error(t("session.kick_out_current_session"))
            // 清除token并跳转到登录页
            changeToken()
            to("/@login")
            return
          }
          notify.error(message || t("session.kick_out_failed"))
        },
      )
    } catch (err) {
      // 检查错误信息是否包含会话失效
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (
        errorMessage.includes("session inactive") ||
        errorMessage.includes("401")
      ) {
        notify.error(t("session.kick_out_current_session"))
        changeToken()
        to("/@login")
        return
      }
      notify.error(t("session.kick_out_failed"))
    } finally {
      setKickingSession(null)
    }
  }

  // 检查是否是当前设备的会话
  const isCurrentDeviceSession = (session: any) => {
    const currentDeviceKey = localStorage.getItem("device_key")
    return currentDeviceKey && session.session_id === currentDeviceKey
  }

  // 处理踢出会话，如果是当前设备则走登出逻辑
  const handleKickOutWithDeviceCheck = async (session: any) => {
    const isCurrent = isCurrentDeviceSession(session)

    if (isCurrent) {
      notify.error(t("session.kick_out_current_session"))
      clearUserData()
      to(`/@login?redirect=${encodeURIComponent(window.location.pathname)}`)
    } else {
      await handleKickOut(session.session_id)
    }
  }

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await getMySession()
      handleResp(
        resp,
        (data) => {
          setSessions(data || [])
        },
        (message) => {
          setError(message)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    fetchSessions()
  })

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          loading={loading()}
          onClick={fetchSessions}
        >
          {t("global.refresh")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For
                each={[
                  { key: "device_id", align: "left" },
                  { key: "system_info", align: "left" },
                  { key: "ip", align: "center" },
                  { key: "last_active", align: "center" },
                  { key: "status", align: "center" },
                  { key: "operations", align: "center" },
                ]}
              >
                {(col) => (
                  <Th textAlign={col.align as any}>
                    {col.key === "operations"
                      ? t("global.operations")
                      : t(`session.${col.key}`)}
                  </Th>
                )}
              </For>
            </Tr>
          </Thead>
          <Tbody>
            <For each={sessions()}>
              {(session) => (
                <Tr>
                  <For
                    each={[
                      {
                        key: "device_id",
                        align: "left",
                        content: session.session_id
                          ? `${session.session_id.slice(
                              0,
                              6,
                            )}***${session.session_id.slice(-6)}`
                          : "-",
                      },
                      {
                        key: "system_info",
                        align: "left",
                        content: session.ua
                          ? getSystemDisplayName(session.ua)
                          : "-",
                      },
                      {
                        key: "ip",
                        align: "center",
                        content: session.ip || "-",
                      },
                      {
                        key: "last_active",
                        align: "center",
                        content: session.last_active
                          ? new Date(
                              session.last_active * 1000,
                            ).toLocaleString()
                          : "-",
                      },
                      {
                        key: "status",
                        align: "center",
                        content:
                          session.status === 0
                            ? t("session.active")
                            : t("session.offline"),
                      },
                      {
                        key: "operations",
                        align: "center",
                        content: (
                          <HStack spacing="$2" justifyContent="center">
                            <DeletePopover
                              name={`${
                                session.session_id
                                  ? `${session.session_id.slice(
                                      0,
                                      6,
                                    )}***${session.session_id.slice(-6)}`
                                  : "-"
                              } (${
                                session.ua
                                  ? getSystemDisplayName(session.ua)
                                  : "-"
                              })`}
                              loading={kickingSession() === session.session_id}
                              disabled={kickingSession() !== null}
                              onClick={() =>
                                handleKickOutWithDeviceCheck(session)
                              }
                              buttonText={t("session.kick_out")}
                            />
                          </HStack>
                        ),
                      },
                    ]}
                  >
                    {(col) => (
                      <Td textAlign={col.align as any}>{col.content}</Td>
                    )}
                  </For>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default MySession
