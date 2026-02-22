import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // During build time, if vars are missing, we return a dummy client or handle it gracefully
    // This prevents the '@supabase/ssr' error while allowing static pages to be built
    console.warn('Supabase credentials missing. Returning dummy client for build time.')
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
  }

  return createBrowserClient(url, key)
}
