import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)

export async function transcribeVideo(videoBlob: Blob): Promise<string> {
    try {
        // Convert blob to base64 for Gemini API
        const base64 = await blobToBase64(videoBlob)

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `Please transcribe the audio from this video. Extract all spoken words and return only the transcript text without any additional formatting or commentary.`

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64,
                    mimeType: 'video/webm'
                }
            }
        ])

        const response = await result.response
        return response.text()
    } catch (error) {
        console.error('Transcription error:', error)
        throw new Error('Failed to transcribe video')
    }
}

export async function generateSummary(transcript: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `Please create a concise summary of this video transcript. Highlight the key points and main topics discussed. Keep it brief but informative.

Transcript:
${transcript}`

        const result = await model.generateContent(prompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error('Summary generation error:', error)
        throw new Error('Failed to generate summary')
    }
}

// Helper function to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result as string
            // Remove data URL prefix to get just the base64 string
            const base64Data = base64.split(',')[1]
            resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}
