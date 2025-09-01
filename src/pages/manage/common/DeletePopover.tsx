import {
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverBody,
  HStack,
} from "@hope-ui/solid"
import { useT } from "~/hooks"

export interface DeletePopoverProps {
  name: string
  loading: boolean
  onClick: () => void
  disabled?: boolean
  buttonText?: string
}
export const DeletePopover = (props: DeletePopoverProps) => {
  const t = useT()
  const isDisabled = props.disabled ?? false // 默认值为 false
  const buttonText = props.buttonText ?? t("global.delete") // 默认使用删除文本
  return (
    <Popover>
      {({ onClose }) => (
        <>
          <PopoverTrigger
            as={Button}
            colorScheme="danger"
            disabled={isDisabled}
          >
            {buttonText}
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverHeader>
              {t("global.delete_confirm", {
                name: props.name,
              })}
            </PopoverHeader>
            <PopoverBody>
              <HStack spacing="$2">
                <Button onClick={onClose} colorScheme="neutral">
                  {t("global.cancel")}
                </Button>
                <Button
                  colorScheme="danger"
                  loading={props.loading}
                  onClick={props.onClick}
                >
                  {t("global.confirm")}
                </Button>
              </HStack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  )
}
