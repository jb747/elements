// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { OrySettingsOidcProps } from "@ory/elements-react"
import { DefaultButtonSocial, extractProvider } from "../form/social"
import { UiNodeInputAttributes } from "@ory/client-fetch"
import { DefaultHorizontalDivider } from "../form/horizontal-divider"
import logos from "../../provider-logos"
import Trash from "../../assets/icons/trash.svg"
import { useFormContext } from "react-hook-form"

export function DefaultSettingsOidc({
  linkButtons,
  unlinkButtons,
}: OrySettingsOidcProps) {
  const hasLinkButtons = linkButtons.length > 0
  const hasUnlinkButtons = unlinkButtons.length > 0
  const { setValue } = useFormContext()

  return (
    <div className="flex flex-col gap-8">
      {hasLinkButtons && (
        <div className="flex gap-3 items-start [&>button]:w-[79px]">
          {linkButtons.map((button) => {
            const attrs = button.attributes as UiNodeInputAttributes

            return (
              <DefaultButtonSocial
                showLabel={false}
                key={attrs.value}
                node={button}
                attributes={attrs}
                onClick={() => {
                  setValue("link", attrs.value)
                  setValue("method", "oidc")
                }}
              />
            )
          })}
        </div>
      )}
      {hasUnlinkButtons && hasLinkButtons ? <DefaultHorizontalDivider /> : null}
      {unlinkButtons.map((button) => {
        const attrs = button.attributes as UiNodeInputAttributes
        const provider = extractProvider(button.meta.label?.context) ?? ""
        const Logo = attrs.value in logos ? logos[attrs.value] : logos.generic

        return (
          <div key={attrs.value} className="flex justify-between">
            <div className="flex gap-6 items-center">
              <Logo size={32} />
              <p className="text-dialog-fg-subtle text-sm font-medium">
                {provider}
              </p>
            </div>
            <button
              {...attrs}
              type="submit"
              onClick={() => {
                setValue("unlink", attrs.value)
                setValue("method", "oidc")
              }}
            >
              <Trash className="cursor-pointer text-links-link-mute-default hover:text-links-link-mute-hover" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
