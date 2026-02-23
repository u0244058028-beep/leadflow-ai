import { supabase } from './supabaseClient'

export async function trackEmailOpen(leadId: string, ipAddress?: string, userAgent?: string) {
  try {
    const { error } = await supabase
      .from('email_tracking')
      .insert({
        lead_id: leadId,
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      })

    if (error) throw error
    console.log('✅ Email open tracked for lead:', leadId)
    return true
  } catch (error) {
    console.error('❌ Error tracking email open:', error)
    return false
  }
}

export async function getEmailOpenStats(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('lead_id', leadId)
      .order('opened_at', { ascending: false })

    if (error) throw error

    return {
      totalOpens: data.length,
      firstOpen: data[data.length - 1]?.opened_at || null,
      lastOpen: data[0]?.opened_at || null,
      opens: data
    }
  } catch (error) {
    console.error('Error getting email stats:', error)
    return null
  }
}

export function generateTrackingPixel(leadId: string, baseUrl: string) {
  return `<img src="${baseUrl}/api/track/pixel/${leadId}" width="1" height="1" style="display:none;" alt="" />`
}