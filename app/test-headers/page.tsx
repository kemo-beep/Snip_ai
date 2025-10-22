'use client'

import { useEffect, useState } from 'react'

export default function TestHeaders() {
    const [results, setResults] = useState<{
        sharedArrayBuffer: boolean
        secureContext: boolean
        crossOriginIsolated: boolean
    } | null>(null)

    useEffect(() => {
        setResults({
            sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
            secureContext: window.isSecureContext,
            crossOriginIsolated: crossOriginIsolated
        })
    }, [])

    if (!results) return <div>Loading...</div>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">FFmpeg.wasm Requirements Test</h1>
            
            <div className="space-y-4">
                <div className={`p-4 rounded ${results.sharedArrayBuffer ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h2 className="font-semibold">SharedArrayBuffer</h2>
                    <p>{results.sharedArrayBuffer ? '✅ Available' : '❌ Not Available'}</p>
                    {!results.sharedArrayBuffer && (
                        <p className="text-sm mt-2">
                            Required headers are missing. Check middleware.ts
                        </p>
                    )}
                </div>

                <div className={`p-4 rounded ${results.secureContext ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h2 className="font-semibold">Secure Context (HTTPS)</h2>
                    <p>{results.secureContext ? '✅ Yes' : '❌ No'}</p>
                </div>

                <div className={`p-4 rounded ${results.crossOriginIsolated ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h2 className="font-semibold">Cross-Origin Isolated</h2>
                    <p>{results.crossOriginIsolated ? '✅ Yes' : '❌ No'}</p>
                    {!results.crossOriginIsolated && (
                        <p className="text-sm mt-2">
                            Headers may not be set correctly. Check middleware.ts
                        </p>
                    )}
                </div>

                <div className="p-4 bg-blue-100 rounded">
                    <h2 className="font-semibold">FFmpeg.wasm Status</h2>
                    <p>
                        {results.sharedArrayBuffer && results.crossOriginIsolated
                            ? '✅ FFmpeg.wasm should work'
                            : '❌ FFmpeg.wasm will NOT work'}
                    </p>
                </div>

                <div className="p-4 bg-gray-100 rounded">
                    <h2 className="font-semibold">Required HTTP Headers</h2>
                    <pre className="text-xs mt-2">
{`Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp`}
                    </pre>
                </div>
            </div>
        </div>
    )
}
