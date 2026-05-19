// Pathfinder-AI — RapidAPI (JSearch) wrapper with retry logic

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
const BASE_URL = `https://${RAPIDAPI_HOST}`

async function rapidFetch(path: string, retries = 2): Promise<unknown> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY is not configured')
  }

  const url = `${BASE_URL}${path}`
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
      })

      if (res.status === 429 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error')
        throw new Error(`RapidAPI error (${res.status}): ${text}`)
      }

      return await res.json()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
      if (attempt === retries) break
      const delay = Math.pow(2, attempt) * 1000
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError || new Error('RapidAPI request failed after retries')
}

export async function searchJobs(
  query: string,
  location?: string,
  page: number = 1
): Promise<unknown> {
  const params = new URLSearchParams()
  params.set('query', query)
  if (location) params.set('location', location)
  params.set('page', String(page))
  params.set('num_pages', '1')

  return rapidFetch(`/search?${params.toString()}`)
}

export async function getJobDetails(jobId: string): Promise<unknown> {
  const params = new URLSearchParams()
  params.set('job_id', jobId)
  return rapidFetch(`/job-details?${params.toString()}`)
}
