/**
 * Google Gemini AI service
 * Uses Gemini API for AI-assisted planning
 */

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

export interface GeminiRequest {
  contents: GeminiMessage[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

/**
 * List available Gemini models
 */
export async function listAvailableModels(): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return []
  }

  try {
    // Try v1beta first
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    
    if (!response.ok) {
      // Try v1
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      )
    }
    
    if (response.ok) {
      const data = await response.json()
      const models = data.models?.map((m: any) => m.name) || []
      return models
    } else {
      const errorText = await response.text()
      console.warn('Failed to list models:', response.status, errorText.substring(0, 200))
    }
  } catch (error) {
    console.error('Failed to list models:', error)
  }
  
  return []
}

/**
 * Call Google Gemini API
 * Tries multiple models/versions to find one that works
 */
export async function callGemini(
  messages: GeminiMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
  }
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file. Get a free key from https://makersuite.google.com/app/apikey')
  }

  const request: GeminiRequest = {
    contents: messages,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: options?.maxTokens ?? 2048,
    },
  }

  // First, try to list available models
  let availableModels: string[] = []
  try {
    availableModels = await listAvailableModels()
    if (availableModels.length === 0)
      console.warn('No models returned from ListModels API')
  } catch (error) {
    console.warn('Could not list models, trying defaults:', error)
  }

  // Check for manual model override
  const manualModel = process.env.NEXT_PUBLIC_GEMINI_MODEL
  
  // Build list of models to try
  // Use v1beta API version (more models available)
  const modelsToTry: Array<{ name: string; version: string }> = []
  
  // If manual model specified, try it first
  if (manualModel) {
    const modelName = manualModel.startsWith('models/') ? manualModel : `models/${manualModel}`
    modelsToTry.push({ name: modelName, version: 'v1beta' })
  }
  
  // Add available models from API
  for (const modelName of availableModels) {
    // Keep the full format if it includes "models/"
    if (modelName.includes('models/')) {
      modelsToTry.push({ name: modelName, version: 'v1beta' })
    } else {
      modelsToTry.push({ name: `models/${modelName}`, version: 'v1beta' })
    }
  }
  
  // Add default models if none found (try common free tier models)
  if (modelsToTry.length === 0) {
    modelsToTry.push(
      { name: 'models/gemini-1.5-flash-latest', version: 'v1beta' },
      { name: 'models/gemini-1.5-flash', version: 'v1beta' },
      { name: 'models/gemini-1.5-pro-latest', version: 'v1beta' },
      { name: 'models/gemini-1.5-pro', version: 'v1beta' },
      { name: 'models/gemini-pro', version: 'v1beta' }
    )
  }
  
  let lastError: Error | null = null
  
  for (const { name, version } of modelsToTry) {
    try {
      // URL format: /v1beta/models/{model}:generateContent
      // name already includes "models/" prefix
      const apiUrl = `https://generativelanguage.googleapis.com/${version}/${name}:generateContent?key=${apiKey}`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (response.ok) {
        const data: GeminiResponse = await response.json()
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error('No response from Gemini API')
        }

        return data.candidates[0].content.parts[0].text
      } else {
        // Try next model
        const errorText = await response.text()
        console.warn(`Model ${name} failed (${response.status}):`, errorText.substring(0, 200))
        continue
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }
  
  // If all models failed, throw helpful error
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError)
  throw new Error(`Failed to call Gemini API with any available model. Available models: ${availableModels.join(', ') || 'none found'}. Last error: ${errorMessage}. Please verify your API key is valid.`)
}

/**
 * Format project signals for AI context
 */
export function formatProjectSignalsForAI(signals: Array<{
  projectName: string
  deadlineRisk: number
  financialPain: string | null
  confidenceScore: number
  staleness: number
  actionsCompletedLast7Days: number
  timeLoggedLast7Days: number
}>): string {
  return signals.map((s) => 
    `Project: ${s.projectName}
- Deadline Risk: ${s.deadlineRisk}/100
- Financial Pain: ${s.financialPain || 'None'}
- Confidence: ${s.confidenceScore}/100
- Days since last touched: ${s.staleness}
- Actions completed (7 days): ${s.actionsCompletedLast7Days}
- Time logged (7 days): ${s.timeLoggedLast7Days} minutes`
  ).join('\n\n')
}
