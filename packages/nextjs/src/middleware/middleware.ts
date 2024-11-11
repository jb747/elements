// Copyright © 2024 Ory Corp
// SPDX-License-Identifier: Apache-2.0

import { NextResponse, type NextRequest } from "next/server"
import { rewriteUrls } from "../rewrite"
import { filterRequestHeaders, processSetCookieHeaders } from "../utils"
import { OryConfig } from "../types"
import { defaultOmitHeaders } from "../headers"

function getProjectSdkUrl() {
  let baseUrl = ""

  if (process.env["ORY_SDK_URL"]) {
    baseUrl = process.env["ORY_SDK_URL"]
  }

  return baseUrl.replace(/\/$/, "")
}

function getProjectApiKey() {
  let baseUrl = ""

  if (process.env["ORY_PROJECT_API_TOKEN"]) {
    baseUrl = process.env["ORY_PROJECT_API_TOKEN"]
  }

  return baseUrl.replace(/\/$/, "")
}

async function proxyRequest(request: NextRequest, options: OryConfig) {
  const match = ["/self-service", "/sessions/whoami", "/ui"]
  if (!match.some((m) => request.nextUrl.pathname.startsWith(m))) {
    return NextResponse.next()
  }

  const matchBaseUrl = new URL(getProjectSdkUrl())
  const selfUrl = request.nextUrl.protocol + "//" + request.nextUrl.host

  const upstreamUrl = request.nextUrl.clone()
  upstreamUrl.hostname = matchBaseUrl.hostname
  upstreamUrl.host = matchBaseUrl.host
  upstreamUrl.protocol = matchBaseUrl.protocol
  upstreamUrl.port = matchBaseUrl.port

  const requestHeaders = filterRequestHeaders(
    request.headers,
    options.forwardAdditionalHeaders,
  )
  requestHeaders.set("Host", upstreamUrl.hostname)

  // Ensures we use the correct URL in redirects like OIDC redirects.
  requestHeaders.set("Ory-Base-URL-Rewrite", selfUrl.toString())
  requestHeaders.set("Ory-Base-URL-Rewrite-Token", getProjectApiKey())

  // We disable custom domain redirects.
  requestHeaders.set("Ory-No-Custom-Domain-Redirect", "true")

  // Fetch the upstream response
  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers: requestHeaders,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.arrayBuffer()
        : null,
    redirect: "manual",
  })

  // Delete headers that should not be forwarded
  defaultOmitHeaders.forEach((header) => {
    upstreamResponse.headers.delete(header)
  })

  // Modify cookie domain
  if (upstreamResponse.headers.get("set-cookie")) {
    const cookies = processSetCookieHeaders(
      request.nextUrl.protocol,
      upstreamResponse,
      options,
      requestHeaders,
    )
    upstreamResponse.headers.delete("set-cookie")
    cookies.forEach((cookie) => {
      upstreamResponse.headers.append("Set-Cookie", cookie)
    })
  }

  // Modify location header
  const originalLocation = upstreamResponse.headers.get("location")
  if (originalLocation) {
    let location = originalLocation

    // The legacy hostedui does a redirect to `../self-service` which breaks the NextJS middleware.
    // To fix this, we hard-rewrite `../self-service`.
    //
    // This is not needed with the "new" account experience based on this SDK.
    if (location.startsWith("../self-service")) {
        location = location.replace("../self-service", "/self-service")
    }

    location = rewriteUrls(
        location,
      matchBaseUrl.toString(),
      selfUrl,
      options,
    )
    console.log({originalLocation,      location})

    if (!location.startsWith("http")) {
      // console.debug('rewriting location', selfUrl, location, new URL(location, selfUrl).toString())
      location = new URL(location, selfUrl).toString()
    }


    // Next.js throws an error that is completely unhelpful if the location header is not an absolute URL.
    // Therefore, we throw a more helpful error message here.
    if (!location.startsWith("http")) {
      throw new Error(
        "The HTTP location header must be an absolute URL in NextJS middlewares. However, it is not. The resulting HTTP location is `" +
          location +
          "`. This is either a configuration or code bug. Please open an issue on https://github.com/ory/elements.",
      )
    }

    upstreamResponse.headers.set("location", location)
  }

  // Modify buffer
  let modifiedBody = Buffer.from(await upstreamResponse.arrayBuffer())
  if (
    upstreamResponse.headers.get("content-type")?.includes("text/") ||
    upstreamResponse.headers.get("content-type")?.includes("application/json")
  ) {
    const bufferString = modifiedBody.toString("utf-8")
    modifiedBody = Buffer.from(
      rewriteUrls(bufferString, matchBaseUrl.toString(), selfUrl, options),
    )
  }

  // Return the modified response
  return new NextResponse(modifiedBody, {
    headers: upstreamResponse.headers,
    status: upstreamResponse.status,
  })
}

export function createOryMiddleware(options: OryConfig) {
  return (r: NextRequest) => {
    return proxyRequest(r, options)
  }
}
