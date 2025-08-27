import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { email, full_name, source = "landing_page" } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Insert into newsletter subscribers
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name?.trim(),
        source,
      })
      .select()
      .single()

    if (error) {
      console.error("Newsletter subscription error:", error)

      // Handle duplicate email
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already subscribed to newsletter" }, { status: 409 })
      }

      return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 })
    }

    // Track analytics event
    await supabase.from("analytics_events").insert({
      event_type: "newsletter_signup",
      event_data: {
        email: email.toLowerCase().trim(),
        source,
        has_name: !!full_name,
      },
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(
      {
        message: "Successfully subscribed to newsletter!",
        data: { id: data.id, email: data.email },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Newsletter API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Update subscription status to unsubscribed
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("email", email.toLowerCase().trim())

    if (error) {
      console.error("Newsletter unsubscribe error:", error)
      return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
    }

    // Track analytics event
    await supabase.from("analytics_events").insert({
      event_type: "newsletter_unsubscribe",
      event_data: { email: email.toLowerCase().trim() },
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({ message: "Successfully unsubscribed from newsletter" }, { status: 200 })
  } catch (error) {
    console.error("Newsletter unsubscribe API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
