import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: !!data.session,
      userId: data.session?.user?.id || null,
    })
  } catch (err) {
    console.error('Error in auth test:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
