import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function finishOnboarding(){

 const { data:{ user } } = await supabase.auth.getUser()

 if(!user) return

 await supabase
   .from("profiles")
   .update({ onboarded:true })
   .eq("id",user.id)

 window.dispatchEvent(new Event("onboarding-complete"))
}