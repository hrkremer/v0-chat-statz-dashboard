"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ChatStats } from "@/lib/types"
import { StatCard } from "./stat-card"
import { Download, Copy, Check } from "lucide-react"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stats: ChatStats
}

export function ShareModal({ open, onOpenChange, stats }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const topContributor = Object.entries(stats.messagesPerPerson).sort((a, b) => b[1] - a[1])[0]

  const topReactor = Object.entries(stats.reactionsGiven).sort((a, b) => b[1] - a[1])[0]

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // Create a simple text summary
    const summary = `
Chat Statz - Weekly Summary
===========================

Total Messages: ${stats.totalMessages}
Total Reactions: ${Object.values(stats.reactionsReceived).reduce((a, b) => a + b, 0)}

Top Contributor: ${topContributor?.[0]} (${topContributor?.[1]} messages)
Top Reactor: ${topReactor?.[0]} (${topReactor?.[1]} reactions)

Awards:
${Object.entries(stats.awards)
  .map(([award, winner]) => `- ${award}: ${winner}`)
  .join("\n")}

Top Themes: ${stats.topThemes.join(", ")}
    `.trim()

    const blob = new Blob([summary], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "chat-statz-summary.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Share Your Chat Statz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {topContributor && (
              <StatCard
                title="Top Contributor"
                value={topContributor[0]}
                subtitle={`${topContributor[1]} messages sent`}
                icon="message"
                color="#8b5cf6"
              />
            )}

            {topReactor && (
              <StatCard
                title="Reaction King"
                value={topReactor[0]}
                subtitle={`${topReactor[1]} reactions given`}
                icon="sparkles"
                color="#ec4899"
              />
            )}
          </div>

          {stats.awards && Object.entries(stats.awards).length > 0 && (
            <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
              <h3 className="mb-4 font-semibold">Weekly Awards</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(stats.awards)
                  .slice(0, 4)
                  .map(([award, winner]) => (
                    <div key={award} className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <div>
                        <p className="text-sm font-medium">{award}</p>
                        <p className="text-xs text-muted-foreground">{winner}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Summary
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
