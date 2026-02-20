import { Lead } from "@/types/lead"

export function generateAIMissions(leads:Lead[]){

return leads
.filter(l=>l.status!=="closed")
.map(l=>({

leadId:l.id,
title:`Follow up with ${l.name}`

}))

}