import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { email, full_name, company, phone, message } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Insert into waitlist
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name?.trim(),
        company: company?.trim(),
        phone: phone?.trim(),
        message: message?.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Waitlist insertion error:", error)

      // Handle duplicate email
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already registered for waitlist" }, { status: 409 })
      }

      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 })
    }

    // Track analytics event
    await supabase.from("analytics_events").insert({
      event_type: "waitlist_signup",
      event_data: {
        email: email.toLowerCase().trim(),
        has_company: !!company,
        has_phone: !!phone,
        has_message: !!message,
      },
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(
      {
        message: "Successfully joined waitlist!",
        data: { id: data.id, email: data.email },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Waitlist API error:", error)
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

    // Get user's waitlist entries
    const { data, error } = await supabase.from("waitlist").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Waitlist fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Waitlist GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
