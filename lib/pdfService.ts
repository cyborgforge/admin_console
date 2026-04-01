type GeneratePdfInput = {
  html?: string
  url?: string
  fileName?: string
  options?: Record<string, unknown>
}

const defaultPdfOptions = {
  format: "A4",
  printBackground: true,
}

function getPdfServiceConfig() {
  const baseUrl = process.env.PDF_SERVICE_URL?.trim()
  if (!baseUrl) {
    throw new Error("PDF_SERVICE_URL is not configured")
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")

  return {
    baseUrl: normalizedBaseUrl,
    token: process.env.PDF_SERVICE_TOKEN,
  }
}

export async function requestPdfBuffer(input: GeneratePdfInput): Promise<Buffer> {
  if (!input.html && !input.url) {
    throw new Error("Either html or url is required for PDF generation")
  }

  const { baseUrl, token } = getPdfServiceConfig()
  const endpoint = new URL("/pdf/generate", baseUrl).toString()

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-service-token": token } : {}),
    },
    body: JSON.stringify({
      html: input.html,
      url: input.url,
      fileName: input.fileName,
      options: input.options || defaultPdfOptions,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PDF service failed (${response.status}): ${text || response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}