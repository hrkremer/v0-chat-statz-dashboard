import type { Message, ParsedChat } from "./types"

export class MessageParser {
  private static readonly IMESSAGE_TEXT_PATTERN = /\[(.*?)\]\s+(.*?):\s+(.*?)(?=\n\[|$)/gs
  private static readonly REACTION_PATTERN = /(Loved|Liked|Laughed at|Emphasized|Disliked|Questioned)\s+"(.+?)"/g

  static parseText(content: string): ParsedChat {
    const messages: Message[] = []
    const participantsSet = new Set<string>()

    // Try to parse standard iMessage export format
    const lines = content.split("\n")
    let currentMessage: Partial<Message> | null = null

    for (const line of lines) {
      // Check if line starts with timestamp pattern [Date Time]
      const timestampMatch = line.match(/^\[(.*?)\]/)

      if (timestampMatch) {
        // Save previous message if exists
        if (currentMessage?.timestamp && currentMessage?.sender && currentMessage?.content) {
          messages.push(currentMessage as Message)
        }

        // Parse new message
        const parts = line.split("]:")
        if (parts.length >= 2) {
          const timestamp = parts[0].substring(1)
          const remaining = parts.slice(1).join("]:")
          const senderMatch = remaining.match(/^\s*(.*?):\s*(.*)/)

          if (senderMatch) {
            const sender = senderMatch[1].trim()
            const content = senderMatch[2].trim()

            participantsSet.add(sender)
            currentMessage = {
              timestamp: this.parseTimestamp(timestamp),
              sender,
              content,
              reactions: [],
            }
          }
        }
      } else if (currentMessage && line.trim()) {
        // Continuation of previous message or reaction
        if (this.isReaction(line)) {
          const reaction = this.parseReaction(line)
          if (reaction && currentMessage.reactions) {
            currentMessage.reactions.push(reaction)
          }
        } else {
          // Append to content
          currentMessage.content += " " + line.trim()
        }
      }
    }

    // Add last message
    if (currentMessage?.timestamp && currentMessage?.sender && currentMessage?.content) {
      messages.push(currentMessage as Message)
    }

    // Filter to last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const filteredMessages = messages.filter((m) => m.timestamp >= sevenDaysAgo)

    const dateRange = {
      start: filteredMessages.length > 0 ? filteredMessages[0].timestamp : sevenDaysAgo,
      end: filteredMessages.length > 0 ? filteredMessages[filteredMessages.length - 1].timestamp : new Date(),
    }

    return {
      messages: filteredMessages,
      participants: Array.from(participantsSet),
      dateRange,
    }
  }

  static parseJSON(content: string): ParsedChat {
    try {
      const data = JSON.parse(content)
      const messages: Message[] = []
      const participantsSet = new Set<string>()

      // Handle different JSON formats
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const message = this.parseJSONMessage(item)
          if (message) {
            messages.push(message)
            participantsSet.add(message.sender)
          }
        })
      } else if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach((item: any) => {
          const message = this.parseJSONMessage(item)
          if (message) {
            messages.push(message)
            participantsSet.add(message.sender)
          }
        })
      }

      // Filter to last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const filteredMessages = messages.filter((m) => m.timestamp >= sevenDaysAgo)

      const dateRange = {
        start: filteredMessages.length > 0 ? filteredMessages[0].timestamp : sevenDaysAgo,
        end: filteredMessages.length > 0 ? filteredMessages[filteredMessages.length - 1].timestamp : new Date(),
      }

      return {
        messages: filteredMessages,
        participants: Array.from(participantsSet),
        dateRange,
      }
    } catch (error) {
      throw new Error("Invalid JSON format")
    }
  }

  private static parseJSONMessage(item: any): Message | null {
    if (!item.sender || !item.content) return null

    return {
      timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
      sender: item.sender,
      content: item.content,
      reactions: item.reactions || [],
    }
  }

  private static parseTimestamp(timestamp: string): Date {
    // Handle various timestamp formats
    const date = new Date(timestamp)
    return isNaN(date.getTime()) ? new Date() : date
  }

  private static isReaction(line: string): boolean {
    return /^(Loved|Liked|Laughed at|Emphasized|Disliked|Questioned)/.test(line)
  }

  private static parseReaction(line: string): { type: string; sender: string } | null {
    const match = line.match(/^(Loved|Liked|Laughed at|Emphasized|Disliked|Questioned)\s+(.+)/)
    if (match) {
      return {
        type: match[1],
        sender: "Unknown", // iMessage exports don't always include who reacted
      }
    }
    return null
  }

  static async parseFile(file: File): Promise<ParsedChat> {
    const content = await file.text()
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (extension === "json") {
      return this.parseJSON(content)
    } else {
      return this.parseText(content)
    }
  }
}
