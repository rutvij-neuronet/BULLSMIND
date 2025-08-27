"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Analytics } from "@/lib/analytics"

interface NewsletterFormProps {
  onSuccess?: () => void
  className?: string
  inline?: boolean
}

export function NewsletterForm({ onSuccess, className, inline = false }: NewsletterFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          source: inline ? "inline_form" : "newsletter_form",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe")
      }

      setSuccess(true)
      setFormData({ email: "", full_name: "" })

      Analytics.trackFormSubmission("newsletter", true)
      onSuccess?.()
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      Analytics.trackFormSubmission("newsletter", false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  if (success) {
    return (
      <div className={`text-center space-y-2 ${className}`}>
        <div className="text-primary text-xl">✓</div>
        <p className="text-sm text-muted-foreground">Successfully subscribed to our newsletter!</p>
      </div>
    )
  }

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "..." : "Subscribe"}
        </Button>
      </form>
    )
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newsletter-email">Email Address *</Label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newsletter-name">Name (Optional)</Label>
          <Input
            id="newsletter-name"
            type="text"
            placeholder="Your Name"
            value={formData.full_name}
            onChange={(e) => handleInputChange("full_name", e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
        </Button>
      </form>
    </div>
  )
}
