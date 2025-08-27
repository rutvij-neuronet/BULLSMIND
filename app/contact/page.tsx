import { ContactForm } from "@/components/forms/contact-form"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Contact Pointer AI</h1>
          <p className="text-muted-foreground">Have questions? Want to partner with us? We'd love to hear from you.</p>
        </div>
        <ContactForm />
      </div>
    </div>
  )
}
