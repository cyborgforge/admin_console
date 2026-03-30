import { NextRequest, NextResponse } from "next/server"
import chromium from "@sparticuz/chromium"
import puppeteerCore from "puppeteer-core"
import type { Quotation } from "@/types/quotation"

export const runtime = "nodejs"

async function launchBrowser() {
  if (process.env.VERCEL) {
    const executablePath = await chromium.executablePath()

    return puppeteerCore.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })
  }

  const localPuppeteer = await import("puppeteer")
  return localPuppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null

  try {
    const { quotation } = await request.json() as { quotation: Quotation }

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation data is required" },
        { status: 400 }
      )
    }

    // Calculate totals
    const lineItemsTotal = quotation.lineItems?.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    ) || quotation.amount

    const subtotal = lineItemsTotal
    const discount = quotation.discount || 0
    const gst = Math.round((subtotal - discount) * 0.18)
    const total = subtotal - discount + gst

    const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

    // Generate HTML for quotation
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .container {
              width: 210mm;
              height: 297mm;
              padding: 40px;
              background: white;
            }
            .header {
              margin-bottom: 40px;
              border-bottom: 3px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .header-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              font-size: 12px;
            }
            .header-details > div {
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            .label {
              color: #999;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
            }
            .value {
              font-family: 'Courier New', monospace;
              font-weight: bold;
              font-size: 14px;
            }
            .client-details {
              margin-bottom: 40px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .client-details > div {
              font-size: 14px;
            }
            .client-name {
              font-weight: bold;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .client-org {
              color: #666;
              font-size: 13px;
            }
            table {
              width: 100%;
              margin-bottom: 30px;
              border-collapse: collapse;
              font-size: 12px;
            }
            thead {
              background-color: #f5f5f5;
              border-bottom: 2px solid #333;
            }
            th {
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              color: #333;
            }
            th:nth-child(2),
            th:nth-child(3),
            th:nth-child(4) {
              text-align: right;
            }
            td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
            }
            td:nth-child(2),
            td:nth-child(3),
            td:nth-child(4) {
              text-align: right;
            }
            .summary {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .summary-box {
              width: 280px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
            }
            .summary-row.total {
              border-bottom: none;
              padding-top: 10px;
              font-weight: bold;
              font-size: 14px;
            }
            .summary-label {
              color: #666;
            }
            .summary-value {
              font-family: 'Courier New', monospace;
              font-weight: 600;
            }
            .notes {
              background-color: #f9f9f9;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 30px;
              font-size: 12px;
            }
            .notes-label {
              font-weight: bold;
              color: #999;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .footer {
              text-align: center;
              font-size: 11px;
              color: #999;
              border-top: 1px solid #ddd;
              padding-top: 15px;
              margin-top: auto;
            }
            .negative {
              color: #22c55e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QUOTATION</h1>
              <div class="header-details">
                <div>
                  <div class="label">Quotation No.</div>
                  <div class="value">${quotation.id}</div>
                </div>
                <div style="text-align: right;">
                  <div class="label">Date</div>
                  <div class="value">${new Date(quotation.createdAt || new Date()).toLocaleDateString("en-IN")}</div>
                </div>
              </div>
            </div>

            <div class="client-details">
              <div>
                <div class="label">Bill To</div>
                <div class="client-name">${quotation.client}</div>
                <div class="client-org">${quotation.organization}</div>
              </div>
              <div>
                <div class="label">Valid Until</div>
                <div class="value">${quotation.expiry}</div>
                <div class="client-org">Quote expires on this date</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.lineItems?.map((item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${fmt(item.unitPrice)}</td>
                    <td>${fmt(item.quantity * item.unitPrice)}</td>
                  </tr>
                `).join("") || `
                  <tr>
                    <td>${quotation.product}</td>
                    <td>1</td>
                    <td>${fmt(quotation.amount)}</td>
                    <td>${fmt(quotation.amount)}</td>
                  </tr>
                `}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Subtotal</span>
                  <span class="summary-value">${fmt(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="summary-row">
                    <span class="summary-label">Discount</span>
                    <span class="summary-value negative">− ${fmt(discount)}</span>
                  </div>
                ` : ""}
                <div class="summary-row">
                  <span class="summary-label">GST (18%)</span>
                  <span class="summary-value">${fmt(gst)}</span>
                </div>
                <div class="summary-row total">
                  <span>Total</span>
                  <span style="color: #22c55e;">${fmt(total)}</span>
                </div>
              </div>
            </div>

            ${quotation.notes ? `
              <div class="notes">
                <div class="notes-label">Notes</div>
                <p>${quotation.notes.replace(/\n/g, "<br>")}</p>
              </div>
            ` : ""}

            <div class="footer">
              <p>This is a computer-generated document.</p>
              <p>Thank you for your business.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Launch browser and generate PDF
    browser = await launchBrowser()

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    })

    await browser.close()
    browser = null
    const pdfBytes = Uint8Array.from(pdfBuffer)

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${quotation.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
