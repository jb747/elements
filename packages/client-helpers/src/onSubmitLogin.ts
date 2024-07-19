import { FlowContainer, FlowType } from "./flowTypes"
import { frontendClient } from "./index"
import { loginUrl } from "./urlHelpers"
import { handleFlowError, OnSubmitHandlerProps } from "./utils"
import { LoginFlow, UpdateLoginFlowBody } from "@ory/client-fetch"

/**
 * Use this method to submit a login flow. This method is used in the `onSubmit` handler of the login form.
 *
 * @param config The configuration object.
 * @param flow The flow object.
 * @param setFlowContainer This method is used to update the flow container when a validation error occurs, for example.
 * @param body The form values to submit.
 * @param onRedirect This method is used to redirect the user to a different page.
 */
export async function onSubmitLogin(
  { config, flow }: FlowContainer,
  {
    setFlowContainer,
    body,
    onRedirect,
  }: OnSubmitHandlerProps<UpdateLoginFlowBody>,
) {
  if (!config.sdk.url) {
    throw new Error(
      `Please supply your Ory Network SDK url to the Ory Elements configuration.`,
    )
  }

  await frontendClient(config.sdk.url, config.sdk.options ?? {})
    .updateLoginFlowRaw({
      flow: flow.id,
      updateLoginFlowBody: body,
    })
    .then(async (res) => {
      // Workaround
      window.location.href =
        flow.return_to || config.sdk.url + "/self-service/login/browser"
    })
    .catch(
      handleFlowError({
        onRestartFlow: () => {
          onRedirect(loginUrl(config), true)
        },
        onValidationError: (body: LoginFlow) => {
          setFlowContainer({
            flow: body,
            flowType: FlowType.Login,
          })
        },
        onRedirect,
      }),
    )
}
