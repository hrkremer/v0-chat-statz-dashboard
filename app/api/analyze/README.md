# Chat Statz Analytics API

## Endpoint
`POST /api/analyze`

## Description

Accepts an uploaded JSON file containing 7 days of iMessage data and returns comprehensive computed analytics including volume stats, reactions, engagement dynamics, themes, awards, and pair dynamics.

## Request Format
Send a JSON array where each object represents a message:

\`\`\`json
[
  {
    "id": 1,
    "text": "Hey everyone!",
    "sender": "Alice",
    "timestamp": "2025-01-05T10:30:00Z",
    "reactions": [
      { "from": "Bob", "type": "Loved" },
      { "from": "Charlie", "type": "Liked" }
    ]
  },
  {
    "id": 2,
    "text": "What's up?",
    "sender": "Bob",
    "timestamp": "2025-01-05T10:31:00Z",
    "reactions": []
  }
]
\`\`\`

### Schema
- `id`: number (unique identifier)
- `text`: string | null (message content; null = media message)
- `sender`: string (who sent the message)
- `timestamp`: string (ISO8601 format)
- `reactions`: array of `{ from: string, type: string }`

## Response Format

\`\`\`json
{
  "volume": {
    "totalMessages": 150,
    "messagesPerPerson": { "Alice": 50, "Bob": 60, "Charlie": 40 },
    "percentagePerPerson": { "Alice": 33, "Bob": 40, "Charlie": 27 },
    "avgMessageLength": { "Alice": 45, "Bob": 32, "Charlie": 58 },
    "hourlyActivity": [0, 0, 0, 2, 5, 8, 12, 15, ...],
    "dailyTotals": [
      { "date": "2025-01-05", "count": 25 },
      { "date": "2025-01-06", "count": 30 }
    ]
  },
  "reactions": {
    "totalReactionsGiven": { "Alice": 20, "Bob": 15, "Charlie": 25 },
    "totalReactionsReceived": { "Alice": 22, "Bob": 18, "Charlie": 20 },
    "reactionTypeBreakdown": { "love": 15, "like": 20, "laugh": 25 },
    "mostReactedMessage": {
      "sender": "Alice",
      "content": "Check out this meme!",
      "timestamp": "2025-01-06T14:30:00Z",
      "reactionCount": 8
    },
    "reactionEfficiency": { "Alice": 0.44, "Bob": 0.30, "Charlie": 0.50 }
  },
  "engagement": {
    "mostRepliedToMessage": {
      "sender": "Bob",
      "content": "What should we do this weekend?",
      "timestamp": "2025-01-07T10:00:00Z",
      "replyCount": 12
    },
    "mostIgnoredMessage": {
      "sender": "Charlie",
      "content": "Anyone want to go hiking?",
      "timestamp": "2025-01-08T08:00:00Z"
    },
    "bestConversationStarter": "Alice",
    "leastActivePerson": "Charlie",
    "avgGroupActivity": 50.0
  },
  "themes": {
    "topGroupThemes": ["Weekend", "Plans", "Movies", "Food", "Work"],
    "themesPerPerson": {
      "Alice": ["Movies", "Food", "Music"],
      "Bob": ["Sports", "Gaming", "Plans"],
      "Charlie": ["Work", "Travel", "Books"]
    },
    "sentimentCounts": { "positive": 80, "neutral": 50, "negative": 20 }
  },
  "awards": {
    "essayist": "Alice",
    "minMaxer": "Bob",
    "memeLord": "Charlie",
    "lolDistributor": "Bob",
    "mainCharacter": "Alice",
    "conversationStarter": "Bob"
  },
  "pairs": {
    "reactionAffinity": [
      { "from": "Alice", "to": "Bob", "count": 15 },
      { "from": "Bob", "to": "Alice", "count": 12 }
    ],
    "conversationalPairing": [
      { "from": "Bob", "to": "Alice", "count": 20 },
      { "from": "Alice", "to": "Bob", "count": 18 }
    ]
  },
  "metadata": {
    "totalMessages": 150,
    "participants": ["Alice", "Bob", "Charlie"],
    "dateRange": {
      "start": "2025-01-05T10:00:00Z",
      "end": "2025-01-11T23:00:00Z"
    },
    "daysAnalyzed": 7
  }
}
\`\`\`

## Analytics Breakdown

### 1. Volume Stats
- Total message count
- Per-person message counts and percentages
- Average message length per person
- Hourly activity distribution (24-hour array)
- Daily totals with 7-day sparkline data

### 2. Reaction Stats
- Reactions given and received per person
- Breakdown by reaction type
- Most reacted-to message
- Reaction efficiency ratio (reactions received / messages sent)

### 3. Engagement Dynamics
- Most replied-to message (replies within 3 minutes)
- Most ignored message (no reply within 30 minutes, no reactions)
- Best conversation starter (highest reply-to-message ratio)
- Least active person compared to group average

### 4. Themes & Sentiment
- Top 5 group-level themes (keyword extraction)
- Top 3 themes per person
- Sentiment analysis (positive/neutral/negative counts)

### 5. Awards
- **Essayist**: Longest average message length
- **Min-Maxer**: Shortest average message length (min 5 messages)
- **Meme Lord**: Most media messages (text = null)
- **LOL Distributor**: Most "lol", "lmao", "haha" usage
- **Main Character**: Most reactions received + high engagement
- **Conversation Starter**: Starts the most daily conversations

### 6. Pair Dynamics
- **Reaction Affinity**: Who reacts to whom the most
- **Conversational Pairing**: Who messages after whom (within 5 min)

## Error Responses

### 400 Bad Request
\`\`\`json
{
  "error": "Expected an array of messages"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Failed to process chat data",
  "details": "Error message here"
}
\`\`\`

## Example Usage

### cURL
\`\`\`bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d @chat-data.json
\`\`\`

### JavaScript/TypeScript
\`\`\`typescript
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(chatMessages)
})

const result = await response.json()
if (result.success) {
  console.log('Analytics:', result.data.stats)
}
\`\`\`

### Python
\`\`\`python
import requests
import json

with open('chat-data.json') as f:
    data = json.load(f)

response = requests.post(
    'http://localhost:3000/api/analyze',
    json=data
)

result = response.json()
print(result)
\`\`\`

## Performance

- Optimized for datasets up to 5,000 messages
- Typical response time: < 500ms for 1,000 messages
- All processing happens server-side
- No data is stored or persisted

## Notes

- Messages are automatically sorted chronologically
- Invalid messages are skipped with error logging
- Media messages (text = null) are counted separately
- All timestamps must be valid ISO8601 format
- Minimum 1 message required for analysis
