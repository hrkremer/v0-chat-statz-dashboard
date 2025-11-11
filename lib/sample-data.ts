import type { ParsedChat } from "./types"

// Sample data for demo purposes
export const sampleChat: ParsedChat = {
  messages: [
    {
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      sender: "Alice",
      content: "Hey everyone! Who wants to grab lunch tomorrow?",
      reactions: [{ type: "Loved", sender: "Bob" }],
    },
    {
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 60000),
      sender: "Bob",
      content: "I'm in! What time works?",
      reactions: [],
    },
    {
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 120000),
      sender: "Charlie",
      content: "Count me in too",
      reactions: [{ type: "Liked", sender: "Alice" }],
    },
    {
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      sender: "Alice",
      content: "How about 12:30pm at the usual spot?",
      reactions: [
        { type: "Loved", sender: "Bob" },
        { type: "Emphasized", sender: "Charlie" },
      ],
    },
    {
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 300000),
      sender: "Bob",
      content: "Perfect! See you all there",
      reactions: [],
    },
    {
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      sender: "Charlie",
      content: "That was fun! We should do this every week",
      reactions: [
        { type: "Loved", sender: "Alice" },
        { type: "Loved", sender: "Bob" },
      ],
    },
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      sender: "Alice",
      content: "Same time next week?",
      reactions: [{ type: "Liked", sender: "Charlie" }],
    },
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sender: "Bob",
      content: "Works for me! Also, did anyone see the game last night?",
      reactions: [],
    },
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000),
      sender: "Charlie",
      content: "YES! That last-minute goal was insane",
      reactions: [{ type: "Emphasized", sender: "Bob" }],
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sender: "Alice",
      content: "I missed it but saw the highlights. Crazy!",
      reactions: [],
    },
    {
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      sender: "Bob",
      content: "Morning everyone! Coffee run anyone?",
      reactions: [{ type: "Loved", sender: "Alice" }],
    },
    {
      timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000),
      sender: "Charlie",
      content: "Already had mine but thanks!",
      reactions: [],
    },
  ],
  participants: ["Alice", "Bob", "Charlie"],
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
}
