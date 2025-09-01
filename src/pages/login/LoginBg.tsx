import { Box, useColorModeValue } from "@hope-ui/solid"
import { joinBase } from "~/utils"
import CornerBottom from "./CornerBottom"
import CornerTop from "./CornerTop"
import { Show } from "solid-js"

interface LoginBgProps {
  useNewVersion: boolean
}

const LoginBg = (props: LoginBgProps) => {
  const bgColor = useColorModeValue("#a9c6ff", "#062b74")
  return (
    <Box
      bgColor={props.useNewVersion ? undefined : bgColor()}
      style={
        props.useNewVersion
          ? {
              "background-image": `url(${joinBase("/images/new_bg.png")})`,
              "background-size": "cover",
              "background-position": "center",
            }
          : undefined
      }
      pos="fixed"
      top="0"
      left="0"
      overflow="hidden"
      zIndex="-1"
      w="100vw"
      h="100vh"
    >
      <Show when={!props.useNewVersion}>
        <Box
          pos="absolute"
          right={{
            "@initial": "-100px",
            "@sm": "-300px",
          }}
          top={{
            "@initial": "-1170px",
            "@sm": "-900px",
          }}
        >
          <CornerTop />
        </Box>
        <Box
          pos="absolute"
          left={{
            "@initial": "-100px",
            "@sm": "-200px",
          }}
          bottom={{
            "@initial": "-760px",
            "@sm": "-400px",
          }}
        >
          <CornerBottom />
        </Box>
      </Show>
    </Box>
  )
}

export default LoginBg
