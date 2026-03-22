export interface FactCheckResult {
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE' | 'ERROR';
  confidence: number;
  reason: string;
  supporting_fact_id: string | null;
  model_used: string;
  embedding_model: string;
  compression_ratio: number;
  post_id: string;
  timestamp: string;
  processing_time_ms?: number;
}

export async function performRealtimeFactCheck(claim: string, postId: string): Promise<FactCheckResult> {
  const apiKey = localStorage.getItem('satyaapi_api_key');
  if (!apiKey) {
    throw new Error("Missing API Key. Please generate one in the API Keys section.");
  }

  const startTime = Date.now();

  try {
    const response = await fetch('/v1/fact-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ claim })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Invalid or revoked API key.");
      } else if (response.status === 429) {
        throw new Error("Too Many Requests: Monthly limit reached.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    }

    const data = await response.json();
    const processing_time_ms = Date.now() - startTime;

    return {
      verdict: data.verdict,
      confidence: data.confidence || 0,
      reason: data.reasoning || data.reason || "No reasoning provided.",
      supporting_fact_id: data.id || "backend-fact-check",
      model_used: "gemini-3.1-pro-preview",
      embedding_model: "none",
      compression_ratio: 1.0,
      post_id: postId,
      timestamp: new Date().toISOString(),
      processing_time_ms
    };
  } catch (error: any) {
    console.error("Fact check error:", error);
    throw new Error(error.message || "Failed to perform real-time fact check. Please try again.");
  }
}
