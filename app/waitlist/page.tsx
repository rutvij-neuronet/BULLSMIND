import { WaitlistForm } from "@/components/forms/waitlist-form"

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join the Pointer AI Waitlist</h1>
          <p className="text-muted-foreground">
            Be among the first to experience revolutionary AI-powered market analysis
          </p>
        </div>
        <WaitlistForm />
      </div>
    </div>
  )
}
