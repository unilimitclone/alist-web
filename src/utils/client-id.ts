import { v4 as uuidv4 } from "uuid"

const CLIENT_ID_KEY = "alist_client_id"

export function getClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY)
  if (!clientId) {
    clientId = uuidv4()
    localStorage.setItem(CLIENT_ID_KEY, clientId)
  }
  return clientId
}
