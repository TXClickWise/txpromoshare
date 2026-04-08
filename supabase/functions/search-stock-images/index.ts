import { corsHeaders } from '@supabase/supabase-js/cors'

interface StockImage {
  id: string
  url: string
  thumb: string
  width: number
  height: number
  alt: string
  source: 'unsplash' | 'pexels'
  photographer: string
  downloadUrl: string
}

async function searchUnsplash(query: string, page: number, perPage: number): Promise<StockImage[]> {
  const key = Deno.env.get('UNSPLASH_ACCESS_KEY')
  if (!key || key === 'placeholder') return []
  
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) { await res.text(); return [] }
    const data = await res.json()
    return (data.results || []).map((p: any) => ({
      id: `unsplash-${p.id}`,
      url: p.urls.regular,
      thumb: p.urls.small,
      width: p.width,
      height: p.height,
      alt: p.alt_description || p.description || query,
      source: 'unsplash' as const,
      photographer: p.user?.name || 'Unknown',
      downloadUrl: p.urls.full,
    }))
  } catch { return [] }
}

async function searchPexels(query: string, page: number, perPage: number): Promise<StockImage[]> {
  const key = Deno.env.get('PEXELS_API_KEY')
  if (!key || key === 'placeholder') return []
  
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
      { headers: { Authorization: key } }
    )
    if (!res.ok) { await res.text(); return [] }
    const data = await res.json()
    return (data.photos || []).map((p: any) => ({
      id: `pexels-${p.id}`,
      url: p.src.large,
      thumb: p.src.medium,
      width: p.width,
      height: p.height,
      alt: p.alt || query,
      source: 'pexels' as const,
      photographer: p.photographer || 'Unknown',
      downloadUrl: p.src.original,
    }))
  } catch { return [] }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, page = 1, perPage = 15 } = await req.json()
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const half = Math.ceil(perPage / 2)
    const [unsplash, pexels] = await Promise.all([
      searchUnsplash(query, page, half),
      searchPexels(query, page, perPage - half),
    ])

    // Interleave results
    const results: StockImage[] = []
    const maxLen = Math.max(unsplash.length, pexels.length)
    for (let i = 0; i < maxLen; i++) {
      if (i < unsplash.length) results.push(unsplash[i])
      if (i < pexels.length) results.push(pexels[i])
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
