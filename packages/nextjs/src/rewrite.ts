// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { OryConfig } from "./types"
import { joinUrlPaths } from "./urls"

export function rewriteUrls(
  source: string,
  matchBaseUrl: string,
  selfUrl: string,
  config: OryConfig,
) {
  for (const [_, [matchPath, replaceWith]] of [
    // TODO load these dynamically from the project config
    ["/ui/recovery", config.override?.recoveryUiPath],
    ["/ui/registration", config.override?.registrationUiPath],
    ["/ui/login", config.override?.loginUiPath],
    ["/ui/verification", config.override?.verificationUiPath],
    ["/ui/settings", config.override?.settingsUiPath],
  ].entries()) {
    console.log(matchPath, replaceWith)
    const match = joinUrlPaths(matchBaseUrl, matchPath || "")
    if (replaceWith && source.startsWith(match)) {
      source = source.replaceAll(
        match,
        new URL(replaceWith, selfUrl).toString(),
      )
    }
  }

  if (source.startsWith(matchBaseUrl)) {
    source = source.replaceAll(
      matchBaseUrl.replace(/\/$/, ""),
      new URL(selfUrl).toString().replace(/\/$/, ""),
    )
  }

  return source
}
