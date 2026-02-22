// Finn rescoreLead-funksjonen og erstatt den med denne:

async function rescoreLead(leadId: string) {
  if (!leadId) {
    alert('Invalid lead ID')
    return
  }
  
  setScoringLead(leadId)
  
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      alert('You must be logged in')
      setScoringLead(null)
      return
    }

    // Hent ALL relevant data om leadet
    const lead = leads.find(l => l.id === leadId)
    
    console.log('Scoring lead:', lead) // Debug

    const { data: notes } = await supabase
      .from('notes')
      .select('content')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('lead_id', leadId)

    const { data: emails } = await supabase
      .from('ai_activity_log')
      .select('*')
      .eq('lead_id', leadId)
      .eq('action_type', 'email_sent')

    const notesText = notes?.map(n => n.content).join('\n') || 'No notes'
    const taskCount = tasks?.length || 0
    const emailCount = emails?.length || 0

    // Logg data for debugging
    console.log('Lead data for scoring:', {
      title: lead?.title,
      company: lead?.company,
      industry: lead?.industry,
      notesCount: notes?.length,
      taskCount,
      emailCount
    })

    // 🎯 SMART PROMPT for lead-scoring
    const prompt = `You are an expert B2B sales lead scorer. Analyze this lead and return a score 1-10.

SCORING CRITERIA:
- 9-10: Decision maker (CEO/Founder/Director), active need, budget available (HOT)
- 7-8: Manager level, interested, has influence, engaged (WARM)
- 4-6: Individual contributor, some interest but no urgency (LUKEWARM)
- 1-3: Cold contact, no engagement, wrong industry (COLD)

LEAD DATA:
Name: ${lead?.name || 'Unknown'}
Title: ${lead?.title || 'Not specified'}
Company: ${lead?.company || 'Unknown'}
Industry: ${lead?.industry || 'Unknown'}
Company Size: ${lead?.company_size || 'Unknown'}
Status: ${lead?.status || 'new'}

ENGAGEMENT METRICS:
- Total notes: ${notes?.length || 0}
- Tasks created: ${taskCount}
- Emails sent: ${emailCount}

RECENT NOTES:
${notesText}

Consider:
1. Job title (higher score for decision makers)
2. Industry relevance
3. Company size
4. Engagement level (notes, emails, tasks)
5. Lead status
6. Context from notes

Return ONLY a number between 1-10.`

    console.log('Sending prompt to Puter.ai...')

    const response = await window.puter.ai.chat(prompt, {
      model: 'google/gemini-2.5-flash',
      temperature: 0.3,
      max_tokens: 5
    })

    console.log('Raw AI response:', response)

    // Håndter respons
    let scoreText = '5'
    if (typeof response === 'string') {
      scoreText = response
    } else if (response?.message?.content) {
      scoreText = response.message.content
    } else if (response?.choices?.[0]?.message?.content) {
      scoreText = response.choices[0].message.content
    }

    console.log('Extracted score text:', scoreText)

    const scoreMatch = scoreText.match(/\d+/)
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 5
    const finalScore = Math.min(10, Math.max(1, score))

    console.log('Final score:', finalScore)

    // Generer en kort forklaring
    const reasonPrompt = `Based on this lead data, explain in ONE SENTENCE why they scored ${finalScore}/10.
    Focus on the key factor (title, engagement, industry, etc.).
    
    Lead: ${lead?.title || 'No title'} at ${lead?.company || 'unknown company'} in ${lead?.industry || 'unknown industry'}
    Engagement: ${notes?.length || 0} notes, ${taskCount} tasks, ${emailCount} emails
    
    Explanation:`

    const reasonResponse = await window.puter.ai.chat(reasonPrompt, {
      model: 'google/gemini-2.5-flash',
      temperature: 0.3,
      max_tokens: 50
    })

    let reason = 'Score updated'
    if (typeof reasonResponse === 'string') {
      reason = reasonResponse
    } else if (reasonResponse?.message?.content) {
      reason = reasonResponse.message.content
    }

    console.log('Score reason:', reason)

    // Oppdater i databasen
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        ai_score: finalScore,
        last_scored: new Date().toISOString(),
        score_reason: reason
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw updateError
    }

    // Logg aktivitet
    await supabase.from('ai_activity_log').insert({
      user_id: user.id,
      lead_id: leadId,
      action_type: 'score_updated',
      description: `Lead scored ${finalScore}/10 - ${reason}`,
      metadata: { 
        score: finalScore,
        reason: reason,
        notes_count: notes?.length,
        tasks_count: taskCount,
        emails_count: emailCount,
        title: lead?.title,
        industry: lead?.industry
      }
    })

    await loadLeads()
    alert(`Lead scored ${finalScore}/10!\n\n${reason}`)
    
  } catch (error: any) {
    console.error('Error scoring lead:', error)
    alert('Failed to score lead: ' + (error.message || 'Unknown error'))
  } finally {
    setScoringLead(null)
  }
}