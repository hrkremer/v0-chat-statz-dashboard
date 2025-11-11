export interface Message {
  timestamp: Date
  sender: string
  content: string
  reactions?: Reaction[]
}

export interface Reaction {
  type: string
  sender: string
}

export interface ParsedChat {
  messages: Message[]
  participants: string[]
  dateRange: {
    start: Date
    end: Date
  }
}

export interface VolumeStats {
  totalMessages: number
  messagesPerPerson: Record<string, number>
  percentagePerPerson: Record<string, number>
  avgMessageLength: Record<string, number>
  hourlyActivity: number[]
  dailyTotals: DailyTotal[]
}

export interface DailyTotal {
  date: string
  count: number
}

export interface ReactionStats {
  totalReactionsGiven: Record<string, number>
  totalReactionsReceived: Record<string, number>
  reactionTypeBreakdown: Record<string, number>
  mostReactedMessage: MessageHighlight | null
  reactionEfficiency: Record<string, number>
}

export interface EngagementStats {
  mostRepliedToMessage: MessageHighlight | null
  mostIgnoredMessage: MessageHighlight | null
  bestConversationStarter: string | null
  leastActivePerson: string | null
  avgGroupActivity: number
}

export interface ThemeStats {
  topGroupThemes: string[]
  themesPerPerson: Record<string, string[]>
  sentimentCounts: {
    positive: number
    neutral: number
    negative: number
  }
}

export interface Awards {
  essayist: string | null
  minMaxer: string | null
  memeLord: string | null
  lolDistributor: string | null
  mainCharacter: string | null
  conversationStarter: string | null
}

export interface PairDynamics {
  reactionAffinity: Array<{ from: string; to: string; count: number }>
  conversationalPairing: Array<{ from: string; to: string; count: number }>
}

export interface MessageHighlight {
  id?: number
  sender: string
  content: string
  timestamp: string
  reactionCount?: number
  replyCount?: number
}

export interface AnalyticsResult {
  volume: VolumeStats
  reactions: ReactionStats
  engagement: EngagementStats
  themes: ThemeStats
  awards: Awards
  pairs: PairDynamics
}

export interface ChatStats {
  totalMessages: number
  messagesPerPerson: Record<string, number>
  percentagePerPerson: Record<string, number>
  avgMessageLength: Record<string, number>
  reactionsGiven: Record<string, number>
  reactionsReceived: Record<string, number>
  topReactions: Array<{ type: string; count: number }>
  hourlyActivity: number[]
  topThemes: string[]
  awards: Record<string, string>
}
