"use client"

import { Card } from "@/components/ui/card"
import { Trophy, MessageSquare, Sparkles } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: "trophy" | "message" | "sparkles"
  color?: string
}

export function StatCard({ title, value, subtitle, icon, color = "#8b5cf6" }: StatCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "trophy":
        return <Trophy className="h-8 w-8" />
      case "message":
        return <MessageSquare className="h-8 w-8" />
      case "sparkles":
        return <Sparkles className="h-8 w-8" />
      default:
        return <Trophy className="h-8 w-8" />
    }
  }

  return (
    <Card
      className="relative overflow-hidden p-8"
      style={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      }}
    >
      <div className="relative z-10">
        <div className="mb-4 inline-flex rounded-full p-3" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{getIcon()}</div>
        </div>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
        <p className="mb-1 text-4xl font-bold" style={{ color }}>
          {value}
        </p>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10" style={{ backgroundColor: color }} />
    </Card>
  )
}
