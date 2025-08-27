import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { full_name, email, company, phone, subject, message } = body

    // Validate required fields
    if (!full_name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Insert contact submission
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim(),
        phone: phone?.trim(),
        subject: subject?.trim(),
        message: message.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Contact submission error:", error)
      return NextResponse.json({ error: "Failed to submit contact form" }, { status: 500 })
    }

    // Track analytics event
    await supabase.from("analytics_events").insert({
      event_type: "contact_form_submission",
      event_data: {
        has_company: !!company,
        has_phone: !!phone,
        has_subject: !!subject,
        message_length: message.length,
      },
      ip_address: request.ip,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(
      {
        message: "Contact form submitted successfully!",
        data: { id: data.id },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Contact API error:", error)
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

    // Get user's contact submissions
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Contact submissions fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch contact submissions" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Contact GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
