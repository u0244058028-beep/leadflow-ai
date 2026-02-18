'use client'

import { supabase } from '@/lib/supabase'

export default function Test() {

 async function testConnection() {
   const { data, error } = await supabase.from('test').select('*')
   console.log(data, error)
 }

 return (
   <button onClick={testConnection}>
     Test Supabase
   </button>
 )
}
