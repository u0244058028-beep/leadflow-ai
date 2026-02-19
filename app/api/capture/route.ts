import { getOpenAI } from "../../lib/openai"

export async function POST(req:Request){

  try{

    const { input } = await req.json()

    const openai = getOpenAI()

    const completion = await openai.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {
          role:"system",
          content:`Extract structured lead info.

Return EXACT JSON:

{
  "name":"",
  "email":"",
  "notes":""
}`
        },
        {
          role:"user",
          content:input
        }
      ]
    })

    const text = completion.choices[0].message.content || "{}"

    return Response.json(JSON.parse(text))

  }catch(e){

    console.error(e)

    return Response.json({ error:"capture failed" },{status:500})
  }

}