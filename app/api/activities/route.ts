import { NextResponse } from "next/server"

type ActivityType =
  | "CLIENT_CREATED"
  | "DEAL_CREATED"
  | "NOTE_ADDED"
  | "EMAIL_SENT"
  | "PHONE_CALL"
  | "MEETING_SCHEDULED"
  | "STAGE_CHANGED"

function getAccessToken(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7).trim()
}

/**
 * GET /api/activities
 * Returns mock activities for Clients and Deals.
 */
export async function GET(request: Request) {
  try {
    const accessToken = getAccessToken(request)

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Missing access token.",
        },
        {
          status: 401,
        }
      )
    }

    const url = new URL(request.url)

    const module = url.searchParams.get("module")
    const id = url.searchParams.get("id")

    const activities = [
      {
        id: "1",
        module,
        entityId: id,
        type: "CLIENT_CREATED" as ActivityType,
        title: "Client Created",
        description:
          "Apollo Pharmacy was added to the CRM.",
        user: {
          id: "1",
          name: "Raghav Hari",
        },
        timestamp: "2026-07-15T09:15:00Z",
      },
      {
        id: "2",
        module,
        entityId: id,
        type: "NOTE_ADDED" as ActivityType,
        title: "Note Added",
        description:
          "Requested updated quotation with GST.",
        user: {
          id: "2",
          name: "Akash",
        },
        timestamp: "2026-07-15T11:30:00Z",
      },
      {
        id: "3",
        module,
        entityId: id,
        type: "PHONE_CALL" as ActivityType,
        title: "Call Logged",
        description:
          "Discussed pricing and implementation timeline.",
        user: {
          id: "1",
          name: "Raghav Hari",
        },
        timestamp: "2026-07-15T13:00:00Z",
      },
      {
        id: "4",
        module,
        entityId: id,
        type: "STAGE_CHANGED" as ActivityType,
        title: "Stage Changed",
        description:
          "Deal moved from Proposal Sent to Negotiation.",
        user: {
          id: "2",
          name: "Akash",
        },
        timestamp: "2026-07-15T15:45:00Z",
      },
    ]

    return NextResponse.json({
      activities,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch activities.",
      },
      {
        status: 500,
      }
    )
  }
}