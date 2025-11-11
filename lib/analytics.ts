import type {
  ParsedChat,
  ChatStats,
  Message,
  AnalyticsResult,
  VolumeStats,
  ReactionStats,
  EngagementStats,
  ThemeStats,
  Awards,
  PairDynamics,
  MessageHighlight,
} from "./types"

export class AnalyticsEngine {
  static computeAnalytics(chat: ParsedChat): AnalyticsResult {
    const { messages, participants } = chat

    return {
      volume: this.computeVolumeStats(messages, participants),
      reactions: this.computeReactionStats(messages, participants),
      engagement: this.computeEngagementStats(messages, participants),
      themes: this.computeThemeStats(messages, participants),
      awards: this.computeAwards(messages, participants),
      pairs: this.computePairDynamics(messages),
    }
  }

  private static computeVolumeStats(messages: Message[], participants: string[]): VolumeStats {
    const messagesPerPerson: Record<string, number> = {}
    const messageLengths: Record<string, number[]> = {}
    const avgMessageLength: Record<string, number> = {}
    const hourlyActivity: number[] = new Array(24).fill(0)
    const dailyMap: Record<string, number> = {}

    // Initialize
    participants.forEach((p) => {
      messagesPerPerson[p] = 0
      messageLengths[p] = []
    })

    // Process messages
    messages.forEach((message) => {
      const sender = message.sender

      // Count messages
      messagesPerPerson[sender] = (messagesPerPerson[sender] || 0) + 1

      // Track lengths
      if (!messageLengths[sender]) messageLengths[sender] = []
      messageLengths[sender].push(message.content.length)

      // Track hourly
      hourlyActivity[message.timestamp.getHours()]++

      // Track daily
      const dateStr = message.timestamp.toISOString().split("T")[0]
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1
    })

    // Calculate averages
    participants.forEach((p) => {
      const lengths = messageLengths[p] || []
      avgMessageLength[p] = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0
    })

    // Calculate percentages
    const totalMessages = messages.length
    const percentagePerPerson: Record<string, number> = {}
    participants.forEach((p) => {
      percentagePerPerson[p] = totalMessages > 0 ? Math.round((messagesPerPerson[p] / totalMessages) * 100) : 0
    })

    // Build daily totals
    const dailyTotals = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    return {
      totalMessages,
      messagesPerPerson,
      percentagePerPerson,
      avgMessageLength,
      hourlyActivity,
      dailyTotals,
    }
  }

  private static computeReactionStats(messages: Message[], participants: string[]): ReactionStats {
    const reactionsGiven: Record<string, number> = {}
    const reactionsReceived: Record<string, number> = {}
    const reactionTypes: Record<string, number> = {}
    const reactionEfficiency: Record<string, number> = {}

    participants.forEach((p) => {
      reactionsGiven[p] = 0
      reactionsReceived[p] = 0
    })

    let mostReactedMsg: Message | null = null
    let maxReactions = 0

    messages.forEach((message) => {
      const reactionCount = message.reactions?.length || 0

      if (reactionCount > 0) {
        reactionsReceived[message.sender] = (reactionsReceived[message.sender] || 0) + reactionCount

        if (reactionCount > maxReactions) {
          maxReactions = reactionCount
          mostReactedMsg = message
        }

        message.reactions?.forEach((reaction) => {
          reactionTypes[reaction.type] = (reactionTypes[reaction.type] || 0) + 1
          if (reaction.sender) {
            reactionsGiven[reaction.sender] = (reactionsGiven[reaction.sender] || 0) + 1
          }
        })
      }
    })

    // Calculate reaction efficiency
    participants.forEach((p) => {
      const messageCount = messages.filter((m) => m.sender === p).length
      reactionEfficiency[p] = messageCount > 0 ? Number.parseFloat((reactionsReceived[p] / messageCount).toFixed(2)) : 0
    })

    const mostReactedMessage: MessageHighlight | null = mostReactedMsg
      ? {
          sender: mostReactedMsg.sender,
          content: mostReactedMsg.content,
          timestamp: mostReactedMsg.timestamp.toISOString(),
          reactionCount: mostReactedMsg.reactions?.length || 0,
        }
      : null

    return {
      totalReactionsGiven: reactionsGiven,
      totalReactionsReceived: reactionsReceived,
      reactionTypeBreakdown: reactionTypes,
      mostReactedMessage,
      reactionEfficiency,
    }
  }

  private static computeEngagementStats(messages: Message[], participants: string[]): EngagementStats {
    const REPLY_WINDOW = 3 * 60 * 1000 // 3 minutes
    const IGNORE_WINDOW = 30 * 60 * 1000 // 30 minutes

    let mostRepliedMsg: Message | null = null
    let maxReplies = 0
    let mostIgnoredMsg: Message | null = null

    const repliesPerPerson: Record<string, number> = {}
    const messagesPerPerson: Record<string, number> = {}

    messages.forEach((message, idx) => {
      const sender = message.sender
      messagesPerPerson[sender] = (messagesPerPerson[sender] || 0) + 1

      // Count replies within 3 minutes
      let replyCount = 0
      for (let i = idx + 1; i < messages.length; i++) {
        const nextMsg = messages[i]
        const timeDiff = nextMsg.timestamp.getTime() - message.timestamp.getTime()

        if (timeDiff > REPLY_WINDOW) break
        if (nextMsg.sender !== sender) {
          replyCount++
        }
      }

      if (replyCount > maxReplies) {
        maxReplies = replyCount
        mostRepliedMsg = message
      }

      // Track for conversation starter metric
      repliesPerPerson[sender] = (repliesPerPerson[sender] || 0) + replyCount

      // Check if message was ignored (no reactions, no replies within 30 min)
      if (message.content.length > 10 && (!message.reactions || message.reactions.length === 0)) {
        let hasReply = false
        for (let i = idx + 1; i < messages.length; i++) {
          const nextMsg = messages[i]
          const timeDiff = nextMsg.timestamp.getTime() - message.timestamp.getTime()

          if (timeDiff > IGNORE_WINDOW) break
          if (nextMsg.sender !== sender) {
            hasReply = true
            break
          }
        }

        if (!hasReply && !mostIgnoredMsg) {
          mostIgnoredMsg = message
        }
      }
    })

    // Best conversation starter
    let bestStarter: string | null = null
    let bestRatio = 0
    participants.forEach((p) => {
      const msgCount = messagesPerPerson[p] || 0
      if (msgCount > 0) {
        const ratio = (repliesPerPerson[p] || 0) / msgCount
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestStarter = p
        }
      }
    })

    // Least active person
    const avgActivity = messages.length / participants.length
    let leastActive: string | null = null
    let minMessages = Number.POSITIVE_INFINITY
    participants.forEach((p) => {
      const count = messagesPerPerson[p] || 0
      if (count < minMessages) {
        minMessages = count
        leastActive = p
      }
    })

    return {
      mostRepliedToMessage: mostRepliedMsg
        ? {
            sender: mostRepliedMsg.sender,
            content: mostRepliedMsg.content,
            timestamp: mostRepliedMsg.timestamp.toISOString(),
            replyCount: maxReplies,
          }
        : null,
      mostIgnoredMessage: mostIgnoredMsg
        ? {
            sender: mostIgnoredMsg.sender,
            content: mostIgnoredMsg.content,
            timestamp: mostIgnoredMsg.timestamp.toISOString(),
          }
        : null,
      bestConversationStarter: bestStarter,
      leastActivePerson: leastActive,
      avgGroupActivity: Number.parseFloat(avgActivity.toFixed(1)),
    }
  }

  private static computeThemeStats(messages: Message[], participants: string[]): ThemeStats {
    const topGroupThemes = this.extractThemes(messages)

    // Per-person themes
    const themesPerPerson: Record<string, string[]> = {}
    participants.forEach((p) => {
      const personMessages = messages.filter((m) => m.sender === p)
      themesPerPerson[p] = this.extractThemes(personMessages).slice(0, 3)
    })

    // Simple sentiment analysis
    const sentimentCounts = this.analyzeSentiment(messages)

    return {
      topGroupThemes,
      themesPerPerson,
      sentimentCounts,
    }
  }

  private static analyzeSentiment(messages: Message[]): {
    positive: number
    neutral: number
    negative: number
  } {
    const positiveWords = [
      "love",
      "great",
      "awesome",
      "amazing",
      "happy",
      "excited",
      "wonderful",
      "fantastic",
      "perfect",
      "excellent",
      "best",
      "good",
      "nice",
      "beautiful",
      "fun",
      "lol",
      "haha",
      "thanks",
      "thank",
    ]
    const negativeWords = [
      "hate",
      "bad",
      "terrible",
      "awful",
      "sad",
      "angry",
      "worst",
      "horrible",
      "annoying",
      "stupid",
      "sucks",
      "damn",
      "ugh",
      "wtf",
    ]

    let positive = 0
    let negative = 0
    let neutral = 0

    messages.forEach((message) => {
      const text = message.content.toLowerCase()
      const words = text.split(/\s+/)

      let positiveCount = 0
      let negativeCount = 0

      words.forEach((word) => {
        if (positiveWords.some((pw) => word.includes(pw))) positiveCount++
        if (negativeWords.some((nw) => word.includes(nw))) negativeCount++
      })

      if (positiveCount > negativeCount) positive++
      else if (negativeCount > positiveCount) negative++
      else neutral++
    })

    return { positive, neutral, negative }
  }

  private static extractThemes(messages: Message[]): string[] {
    const wordCount: Record<string, number> = {}
    const stopWords = new Set([
      "the",
      "be",
      "to",
      "of",
      "and",
      "a",
      "in",
      "that",
      "have",
      "i",
      "it",
      "for",
      "not",
      "on",
      "with",
      "he",
      "as",
      "you",
      "do",
      "at",
      "this",
      "but",
      "his",
      "by",
      "from",
      "they",
      "we",
      "say",
      "her",
      "she",
      "or",
      "an",
      "will",
      "my",
      "one",
      "all",
      "would",
      "there",
      "their",
      "what",
      "so",
      "up",
      "out",
      "if",
      "about",
      "who",
      "get",
      "which",
      "go",
      "me",
      "when",
      "make",
      "can",
      "like",
      "time",
      "no",
      "just",
      "him",
      "know",
      "take",
      "people",
      "into",
      "year",
      "your",
      "good",
      "some",
      "could",
      "them",
      "see",
      "other",
      "than",
      "then",
      "now",
      "look",
      "only",
      "come",
      "its",
      "over",
      "think",
      "also",
      "back",
      "after",
      "use",
      "two",
      "how",
      "our",
      "work",
      "first",
      "well",
      "way",
      "even",
      "new",
      "want",
      "because",
      "any",
      "these",
      "give",
      "day",
      "most",
      "us",
      "is",
      "was",
      "are",
      "been",
      "has",
      "had",
      "were",
      "said",
      "did",
      "having",
      "im",
      "thats",
      "dont",
      "cant",
      "isnt",
      "wasnt",
      "arent",
      "yeah",
      "ok",
      "okay",
      "lol",
      "haha",
      "omg",
    ])

    messages.forEach((message) => {
      const words = message.content
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word))

      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
    })

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))
  }

  private static computeAwards(messages: Message[], participants: string[]): Awards {
    const messagesPerPerson: Record<string, number> = {}
    const messageLengths: Record<string, number[]> = {}
    const reactionsGiven: Record<string, number> = {}
    const reactionsReceived: Record<string, number> = {}
    const lolCount: Record<string, number> = {}
    const mediaCount: Record<string, number> = {}

    participants.forEach((p) => {
      messagesPerPerson[p] = 0
      messageLengths[p] = []
      reactionsGiven[p] = 0
      reactionsReceived[p] = 0
      lolCount[p] = 0
      mediaCount[p] = 0
    })

    messages.forEach((message) => {
      const sender = message.sender

      messagesPerPerson[sender]++
      messageLengths[sender].push(message.content.length)

      // Count media messages (text is null or empty)
      if (!message.content || message.content.trim().length === 0) {
        mediaCount[sender]++
      }

      // Count LOL usage
      const lolWords = ["lol", "lmao", "haha", "lmfao", "rofl"]
      const text = message.content.toLowerCase()
      if (lolWords.some((word) => text.includes(word))) {
        lolCount[sender]++
      }

      // Count reactions
      message.reactions?.forEach((reaction) => {
        reactionsReceived[sender]++
        if (reaction.sender) {
          reactionsGiven[reaction.sender]++
        }
      })
    })

    // Calculate averages
    const avgLengths: Record<string, number> = {}
    participants.forEach((p) => {
      const lengths = messageLengths[p]
      avgLengths[p] = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
    })

    // Essayist
    const essayist =
      Object.entries(avgLengths)
        .filter(([_, len]) => len > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Min-Maxer
    const minMaxer =
      Object.entries(avgLengths)
        .filter(([name]) => messagesPerPerson[name] > 5)
        .sort((a, b) => a[1] - b[1])[0]?.[0] || null

    // Meme Lord (most media)
    const memeLord =
      Object.entries(mediaCount)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // LOL Distributor
    const lolDistributor =
      Object.entries(lolCount)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // Main Character (most reactions received + high message count)
    const mainCharacter =
      Object.entries(reactionsReceived)
        .map(([name, reactions]) => ({
          name,
          score: reactions + messagesPerPerson[name] * 0.5,
        }))
        .sort((a, b) => b.score - a.score)[0]?.name || null

    // Conversation Starter (first message of day)
    const firstMessages: Record<string, number> = {}
    let lastDate = ""
    messages.forEach((message) => {
      const dateStr = message.timestamp.toDateString()
      if (dateStr !== lastDate) {
        firstMessages[message.sender] = (firstMessages[message.sender] || 0) + 1
        lastDate = dateStr
      }
    })
    const conversationStarter = Object.entries(firstMessages).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      essayist,
      minMaxer,
      memeLord,
      lolDistributor,
      mainCharacter,
      conversationStarter,
    }
  }

  private static computePairDynamics(messages: Message[]): PairDynamics {
    const reactionAffinityMap: Record<string, Record<string, number>> = {}
    const conversationPairingMap: Record<string, Record<string, number>> = {}

    // Reaction affinity
    messages.forEach((message) => {
      message.reactions?.forEach((reaction) => {
        if (!reaction.sender) return

        if (!reactionAffinityMap[reaction.sender]) {
          reactionAffinityMap[reaction.sender] = {}
        }
        reactionAffinityMap[reaction.sender][message.sender] =
          (reactionAffinityMap[reaction.sender][message.sender] || 0) + 1
      })
    })

    // Conversational pairing (who messages after whom)
    for (let i = 0; i < messages.length - 1; i++) {
      const currentMsg = messages[i]
      const nextMsg = messages[i + 1]

      // Only count if next message is within 5 minutes
      const timeDiff = nextMsg.timestamp.getTime() - currentMsg.timestamp.getTime()
      if (timeDiff < 5 * 60 * 1000 && currentMsg.sender !== nextMsg.sender) {
        if (!conversationPairingMap[nextMsg.sender]) {
          conversationPairingMap[nextMsg.sender] = {}
        }
        conversationPairingMap[nextMsg.sender][currentMsg.sender] =
          (conversationPairingMap[nextMsg.sender][currentMsg.sender] || 0) + 1
      }
    }

    // Convert to arrays
    const reactionAffinity: Array<{ from: string; to: string; count: number }> = []
    Object.entries(reactionAffinityMap).forEach(([from, targets]) => {
      Object.entries(targets).forEach(([to, count]) => {
        if (count > 0) {
          reactionAffinity.push({ from, to, count })
        }
      })
    })
    reactionAffinity.sort((a, b) => b.count - a.count)

    const conversationalPairing: Array<{ from: string; to: string; count: number }> = []
    Object.entries(conversationPairingMap).forEach(([from, targets]) => {
      Object.entries(targets).forEach(([to, count]) => {
        if (count > 0) {
          conversationalPairing.push({ from, to, count })
        }
      })
    })
    conversationalPairing.sort((a, b) => b.count - a.count)

    return {
      reactionAffinity,
      conversationalPairing,
    }
  }

  static calculateStats(chat: ParsedChat): ChatStats {
    const { messages, participants } = chat

    const messagesPerPerson: Record<string, number> = {}
    const avgMessageLength: Record<string, number> = {}
    const reactionsGiven: Record<string, number> = {}
    const reactionsReceived: Record<string, number> = {}
    const messageLengths: Record<string, number[]> = {}
    const hourlyActivity: number[] = new Array(24).fill(0)
    const reactionTypes: Record<string, number> = {}

    participants.forEach((p) => {
      messagesPerPerson[p] = 0
      messageLengths[p] = []
      reactionsGiven[p] = 0
      reactionsReceived[p] = 0
    })

    messages.forEach((message) => {
      const sender = message.sender

      if (messagesPerPerson[sender] !== undefined) {
        messagesPerPerson[sender]++
      }

      if (!messageLengths[sender]) {
        messageLengths[sender] = []
      }
      messageLengths[sender].push(message.content.length)

      const hour = message.timestamp.getHours()
      hourlyActivity[hour]++

      if (message.reactions && message.reactions.length > 0) {
        reactionsReceived[sender] = (reactionsReceived[sender] || 0) + message.reactions.length

        message.reactions.forEach((reaction) => {
          reactionTypes[reaction.type] = (reactionTypes[reaction.type] || 0) + 1

          if (reaction.sender && reactionsGiven[reaction.sender] !== undefined) {
            reactionsGiven[reaction.sender]++
          }
        })
      }
    })

    participants.forEach((p) => {
      if (messageLengths[p] && messageLengths[p].length > 0) {
        const total = messageLengths[p].reduce((sum, len) => sum + len, 0)
        avgMessageLength[p] = Math.round(total / messageLengths[p].length)
      } else {
        avgMessageLength[p] = 0
      }
    })

    const totalMessages = messages.length
    const percentagePerPerson: Record<string, number> = {}
    participants.forEach((p) => {
      percentagePerPerson[p] = totalMessages > 0 ? Math.round((messagesPerPerson[p] / totalMessages) * 100) : 0
    })

    const topReactions = Object.entries(reactionTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topThemes = this.extractThemes(messages)

    const awards = this.calculateAwards(
      messages,
      messagesPerPerson,
      avgMessageLength,
      reactionsGiven,
      reactionsReceived,
    )

    return {
      totalMessages,
      messagesPerPerson,
      percentagePerPerson,
      avgMessageLength,
      reactionsGiven,
      reactionsReceived,
      topReactions,
      hourlyActivity,
      topThemes,
      awards,
    }
  }

  private static calculateAwards(
    messages: Message[],
    messagesPerPerson: Record<string, number>,
    avgMessageLength: Record<string, number>,
    reactionsGiven: Record<string, number>,
    reactionsReceived: Record<string, number>,
  ): Record<string, string> {
    const awards: Record<string, string> = {}

    const essayist = Object.entries(avgMessageLength).sort((a, b) => b[1] - a[1])[0]
    if (essayist) {
      awards["Essayist"] = essayist[0]
    }

    const minMaxer = Object.entries(avgMessageLength)
      .filter(([name]) => messagesPerPerson[name] > 5)
      .sort((a, b) => a[1] - b[1])[0]
    if (minMaxer) {
      awards["Min-Maxer"] = minMaxer[0]
    }

    const lolDistributor = Object.entries(reactionsGiven).sort((a, b) => b[1] - a[1])[0]
    if (lolDistributor && lolDistributor[1] > 0) {
      awards["LOL Distributor"] = lolDistributor[0]
    }

    const mainCharacter = Object.entries(messagesPerPerson).sort((a, b) => b[1] - a[1])[0]
    if (mainCharacter) {
      awards["Main Character"] = mainCharacter[0]
    }

    const memeLord = Object.entries(reactionsReceived).sort((a, b) => b[1] - a[1])[0]
    if (memeLord && memeLord[1] > 0) {
      awards["Meme Lord"] = memeLord[0]
    }

    const firstMessages: Record<string, number> = {}
    let lastDate = ""
    messages.forEach((message) => {
      const dateStr = message.timestamp.toDateString()
      if (dateStr !== lastDate) {
        firstMessages[message.sender] = (firstMessages[message.sender] || 0) + 1
        lastDate = dateStr
      }
    })
    const conversationStarter = Object.entries(firstMessages).sort((a, b) => b[1] - a[1])[0]
    if (conversationStarter) {
      awards["Conversation Starter"] = conversationStarter[0]
    }

    return awards
  }

  static getMostReactedMessage(messages: Message[]): Message | null {
    if (messages.length === 0) return null

    return messages.reduce((max, message) => {
      const reactionCount = message.reactions?.length || 0
      const maxReactionCount = max.reactions?.length || 0
      return reactionCount > maxReactionCount ? message : max
    })
  }

  static getMostIgnoredMessage(messages: Message[]): Message | null {
    if (messages.length === 0) return null

    const ignoredMessages = messages.filter((message) => {
      const hasReactions = message.reactions && message.reactions.length > 0
      if (hasReactions) return false

      const thirtyMinutesLater = new Date(message.timestamp.getTime() + 30 * 60 * 1000)
      const hasReply = messages.some(
        (m) => m.timestamp > message.timestamp && m.timestamp < thirtyMinutesLater && m.sender !== message.sender,
      )

      return !hasReply && message.content.length > 10
    })

    return ignoredMessages.length > 0 ? ignoredMessages[0] : null
  }
}
