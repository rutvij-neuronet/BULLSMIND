// Client-side analytics utility
export class Analytics {
  private static sessionId: string | null = null

  static getSessionId(): string {
    if (typeof window === "undefined") return ""

    if (!this.sessionId) {
      this.sessionId = sessionStorage.getItem("analytics_session_id")
      if (!this.sessionId) {
        this.sessionId = crypto.randomUUID()
        sessionStorage.setItem("analytics_session_id", this.sessionId)
      }
    }
    return this.sessionId
  }

  static async track(eventType: string, eventData?: Record<string, any>) {
    if (typeof window === "undefined") return

    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: eventType,
          event_data: eventData,
          session_id: this.getSessionId(),
        }),
      })
    } catch (error) {
      console.error("Analytics tracking error:", error)
    }
  }

  // Predefined tracking methods
  static trackPageView(page: string) {
    this.track("page_view", { page })
  }

  static trackButtonClick(buttonName: string, location?: string) {
    this.track("button_click", { button_name: buttonName, location })
  }

  static trackFormSubmission(formType: string, success: boolean) {
    this.track("form_submission", { form_type: formType, success })
  }

  static trackFeatureInteraction(feature: string, action: string) {
    this.track("feature_interaction", { feature, action })
  }
}
