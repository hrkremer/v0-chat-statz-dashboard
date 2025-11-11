import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsEngine } from "@/lib/analytics"
import type { Message, ParsedChat } from "@/lib/types"

interface UploadedMessage {
  id: number
  text: string | null
  sender: string
  timestamp: string
  reactions: Array<{ from: string; type: string }>
}

function validateMessage(item: any): item is UploadedMessage {
  return (
    typeof item === "object" &&
    item !== null &&
    typeof item.id === "number" &&
    (typeof item.text === "string" || item.text === null) &&
    typeof item.sender === "string" &&
    typeof item.timestamp === "string" &&
    Array.isArray(item.reactions)
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!Array.isArray(body)) {
      return NextResponse.json(
        {
          error: "Invalid input format",
          details: "Expected an array of messages",
        },
        { status: 400 },
      )
    }

    if (body.length === 0) {
      return NextResponse.json(
        {
          error: "Empty message array",
          details: "Please provide at least one message",
        },
        { status: 400 },
      )
    }

    const messages: Message[] = []
    const participantsSet = new Set<string>()
    const errors: string[] = []

    body.forEach((item, index) => {
      if (!validateMessage(item)) {
        errors.push(`Message at index ${index} has invalid format`)
        return
      }

      const timestamp = new Date(item.timestamp)
      if (isNaN(timestamp.getTime())) {
        errors.push(`Message at index ${index} has invalid timestamp: ${item.timestamp}`)
        return
      }

      participantsSet.add(item.sender)

      const reactions =
        item.reactions?.map((r) => {
          if (r.from) participantsSet.add(r.from)
          return {
            type: r.type,
            sender: r.from,
          }
        }) || []

      messages.push({
        timestamp,
        sender: item.sender,
        content: item.text || "",
        reactions,
      })
    })

    if (messages.length === 0) {
      return NextResponse.json(
        {
          error: "No valid messages",
          details: errors.length > 0 ? errors : "All messages failed validation",
        },
        { status: 400 },
      )
    }

    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const parsedChat: ParsedChat = {
      messages,
      participants: Array.from(participantsSet),
      dateRange: {
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp,
      },
    }

    const analytics = AnalyticsEngine.computeAnalytics(parsedChat)

    const daysAnalyzed = Math.ceil(
      (parsedChat.dateRange.end.getTime() - parsedChat.dateRange.start.getTime()) / (1000 * 60 * 60 * 24),
    )

    return NextResponse.json({
      volume: analytics.volume,
      reactions: analytics.reactions,
      engagement: analytics.engagement,
      themes: analytics.themes,
      awards: analytics.awards,
      pairs: analytics.pairs,
      metadata: {
        totalMessages: messages.length,
        participants: Array.from(participantsSet),
        dateRange: {
          start: parsedChat.dateRange.start.toISOString(),
          end: parsedChat.dateRange.end.toISOString(),
        },
        daysAnalyzed,
      },
    })
  } catch (error) {
    console.error("[v0] Error processing analytics:", error)
    return NextResponse.json(
      {
        error: "Failed to process chat data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
