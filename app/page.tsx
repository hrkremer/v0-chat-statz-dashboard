"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageParser } from "@/lib/message-parser"
import { sampleChat } from "@/lib/sample-data"
import type { ParsedChat } from "@/lib/types"
import { Dashboard } from "@/components/dashboard"

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [chatData, setChatData] = useState<ParsedChat | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) return

    setAnalyzing(true)
    setError(null)

    try {
      const parsed = await MessageParser.parseFile(file)

      if (parsed.messages.length === 0) {
        setError("No messages found in the last 7 days")
        setAnalyzing(false)
        return
      }

      setChatData(parsed)
    } catch (err) {
      setError("Failed to parse chat file. Please check the format.")
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDemo = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setChatData(sampleChat)
      setAnalyzing(false)
    }, 1000)
  }

  if (chatData) {
    return <Dashboard chatData={chatData} onBack={() => setChatData(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 font-sans text-5xl font-bold tracking-tight text-foreground">Chat Statz</h1>
          <p className="text-lg text-muted-foreground">Your weekly group chat analytics, wrapped and ready to share</p>
        </div>

        {/* Upload Card */}
        <Card className="mb-8 p-8">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-12 w-12 text-primary" />
            </div>

            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold">Upload Your Chat</h2>
              <p className="text-muted-foreground">Export your iMessage conversation and upload it here</p>
              <p className="mt-2 text-sm text-muted-foreground">We'll analyze the last 7 days automatically</p>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

            <div className="flex flex-col items-center gap-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 px-8 py-6 text-center transition-colors hover:border-primary hover:bg-muted">
                  <p className="text-sm font-medium">{file ? file.name : "Click to choose file"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">TXT or JSON format</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="flex gap-3">
                {file && (
                  <Button size="lg" onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? "Analyzing..." : "Analyze Chat"}
                  </Button>
                )}

                <Button size="lg" variant="outline" onClick={handleDemo} disabled={analyzing}>
                  Try Demo
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* How it Works */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl font-bold text-blue-600">
              1
            </div>
            <h3 className="mb-2 font-semibold">Export Your Chat</h3>
            <p className="text-sm text-muted-foreground">
              Select your group chat in iMessage and export the conversation
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 text-xl font-bold text-pink-600">
              2
            </div>
            <h3 className="mb-2 font-semibold">Upload & Analyze</h3>
            <p className="text-sm text-muted-foreground">
              We'll process the last 7 days and generate insights in seconds
            </p>
          </Card>

          <Card className="p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl font-bold text-green-600">
              3
            </div>
            <h3 className="mb-2 font-semibold">Share the Stats</h3>
            <p className="text-sm text-muted-foreground">Get shareable cards and insights about your group dynamics</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
