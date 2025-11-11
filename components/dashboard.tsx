"use client"

import { useState } from "react"
import type { ParsedChat } from "@/lib/types"
import { AnalyticsEngine } from "@/lib/analytics"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2, Trophy, MessageSquare, Heart, TrendingUp, Clock } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ShareModal } from "./share-modal"

interface DashboardProps {
  chatData: ParsedChat
  onBack: () => void
}

export function Dashboard({ chatData, onBack }: DashboardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const stats = AnalyticsEngine.calculateStats(chatData)
  const mostReactedMessage = AnalyticsEngine.getMostReactedMessage(chatData.messages)

  // Prepare data for charts
  const messageData = Object.entries(stats.messagesPerPerson).map(([name, count]) => ({
    name,
    messages: count,
    percentage: stats.percentagePerPerson[name],
  }))

  const reactionData = Object.entries(stats.reactionsReceived).map(([name, count]) => ({
    name,
    reactions: count,
  }))

  const hourlyData = stats.hourlyActivity.map((count, hour) => ({
    hour: `${hour}:00`,
    messages: count,
  }))

  const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"]

  const handleDownload = () => {
    const summary = `Chat Statz Weekly Report
    
Total Messages: ${stats.totalMessages}
Participants: ${chatData.participants.join(", ")}
Date Range: ${chatData.dateRange.start.toLocaleDateString()} - ${chatData.dateRange.end.toLocaleDateString()}

Message Breakdown:
${Object.entries(stats.messagesPerPerson)
  .map(([name, count]) => `${name}: ${count} messages (${stats.percentagePerPerson[name]}%)`)
  .join("\n")}

Awards:
${Object.entries(stats.awards)
  .map(([award, winner]) => `${award}: ${winner}`)
  .join("\n")}

Top Themes: ${stats.topThemes.join(", ")}
    `.trim()

    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "chat-statz-report.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Your Weekly Chat Statz</h1>
              <p className="text-sm text-muted-foreground">
                {chatData.dateRange.start.toLocaleDateString()} - {chatData.dateRange.end.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShareModalOpen(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.values(stats.reactionsReceived).reduce((a, b) => a + b, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Reactions</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chatData.participants.length}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-muted-foreground">Days Analyzed</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Awards Section */}
        <Card className="mb-8 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold">Weekly Awards</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(stats.awards).map(([award, winner]) => (
              <div key={award} className="rounded-lg border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="mb-2 text-2xl">🏆</div>
                <p className="font-semibold">{award}</p>
                <p className="text-lg text-primary">{winner}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Message Volume Chart */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-bold">Message Volume by Person</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="messages" radius={[8, 8, 0, 0]}>
                {messageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center md:grid-cols-6">
            {messageData.map((person, index) => (
              <div key={person.name}>
                <p className="text-2xl font-bold" style={{ color: colors[index % colors.length] }}>
                  {person.percentage}%
                </p>
                <p className="text-xs text-muted-foreground">{person.name}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Reactions Chart */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-bold">Reactions Received</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={reactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="reactions" fill="#ec4899" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly Activity Heatmap */}
        <Card className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-bold">Hourly Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" interval={2} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Topics & Highlights */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold">Top Themes</h2>
            <div className="flex flex-wrap gap-2">
              {stats.topThemes.map((theme, index) => (
                <span
                  key={theme}
                  className="rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: `${colors[index % colors.length]}15`,
                    color: colors[index % colors.length],
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-xl font-bold">Top Reactions</h2>
            <div className="space-y-3">
              {stats.topReactions.map((reaction) => (
                <div key={reaction.type} className="flex items-center justify-between">
                  <span className="font-medium">{reaction.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${(reaction.count / stats.topReactions[0].count) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{reaction.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Most Reacted Message */}
        {mostReactedMessage && (
          <Card className="mt-8 p-6">
            <h2 className="mb-4 text-xl font-bold">Most Reacted Message</h2>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-2 font-medium text-primary">{mostReactedMessage.sender}</p>
              <p className="mb-3 text-foreground">{mostReactedMessage.content}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{mostReactedMessage.reactions?.length || 0} reactions</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ShareModal open={shareModalOpen} onOpenChange={setShareModalOpen} stats={stats} />
    </div>
  )
}
