import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || 'landscape'
    const perPage = searchParams.get('per_page') || '30'

    const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY

    if (!PEXELS_API_KEY) {
        return NextResponse.json(
            { error: 'Pexels API key not configured' },
            { status: 500 }
        )
    }

    try {
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
            {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            }
        )

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching from Pexels:', error)
        return NextResponse.json(
            { error: 'Failed to fetch photos from Pexels' },
            { status: 500 }
        )
    }
}
