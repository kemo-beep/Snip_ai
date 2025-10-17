'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupInstructions() {
    const copyEnvContent = () => {
        const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`

        navigator.clipboard.writeText(envContent)
        toast.success('Environment variables copied to clipboard!')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Alert>
                <AlertDescription>
                    <strong>Setup Required:</strong> This app requires Supabase and Google Gemini configuration to work properly.
                </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5" />
                            Supabase Setup
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a> and create a new project</li>
                            <li>In your Supabase dashboard, go to Settings → API</li>
                            <li>Copy your Project URL and anon public key</li>
                            <li>Go to Storage and create a new bucket called <code className="bg-gray-100 px-1 rounded">videos</code></li>
                            <li>Set the bucket to public for shareable links</li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5" />
                            Google Gemini Setup
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a></li>
                            <li>Create an API key for Gemini</li>
                            <li>Add it to your environment variables as <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY</code></li>
                        </ol>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Environment Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root with the following content:
                    </p>

                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={copyEnvContent} variant="outline" size="sm" className="gap-2">
                            <Copy className="h-4 w-4" />
                            Copy to Clipboard
                        </Button>
                        <Button
                            onClick={() => window.location.reload()}
                            size="sm"
                            className="gap-2"
                        >
                            Reload Page
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                        After setting up the environment variables, restart your development server with <code className="bg-gray-100 px-1 rounded">npm run dev</code>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
