import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { event_type, event_data, session_id } = body

    // Validate required fields
    if (!event_type) {
      return NextResponse.json({ error: "Event type is required" }, { status: 400 })
    }

    // Get user if authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert analytics event
    const { error } = await supabase.from("analytics_events").insert({
      event_type,
      event_data: event_data || {},
      user_id: user?.id || null,
      session_id,
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    if (error) {
      console.error("Analytics insertion error:", error)
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
    }

    return NextResponse.json({ message: "Event tracked successfully" }, { status: 201 })
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const event_type = searchParams.get("event_type")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(limit)

    if (event_type) {
      query = query.eq("event_type", event_type)
    }

    const { data, error } = await query

    if (error) {
      console.error("Analytics fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Analytics GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
