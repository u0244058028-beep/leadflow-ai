import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request){

  const { email, name, count } = await req.json()

  await resend.emails.send({
    from: "MyLeadAssistant AI <noreply@myleadassistant.com>",
    to: email,
    subject: "You have leads waiting 👀",
    html: `
      <div style="font-family:sans-serif">
        <h2>Hey ${name},</h2>
        <p>You have ${count} leads that need follow-up today.</p>
        <p>Log in and close some deals 💰</p>
      </div>
    `
  })

  return Response.json({ success:true })
}