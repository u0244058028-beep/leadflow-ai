// 🎯 BRUK PUTER.JS – helt gratis AI!
console.log('Sending request to Puter.ai...')

const response = await window.puter.ai.chat(
  `Score this sales lead from 1-10. Return only a number between 1-10.
  
  Name: ${lead?.name}
  Company: ${lead?.company || 'Unknown'}
  Status: ${lead?.status}
  Notes: ${notesText}
  
  Score:`,
  { 
    model: 'google/gemini-2.5-flash',
    temperature: 0.3,
    max_tokens: 5
  }
)

console.log('Puter.ai response:', response)  // <-- SE HVA SOM KOMMER UT
console.log('Response type:', typeof response)