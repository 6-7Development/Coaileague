/**
 * Sentiment Analysis Service
 * Uses Gemini AI to analyze message tone for dispute escalation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface SentimentAnalysisResult {
  sentiment: "positive" | "neutral" | "negative" | "hostile";
  confidence: number; // 0-100
  urgencyLevel: 1 | 2 | 3 | 4 | 5; // 1=low, 5=critical
  reasoning: string;
  shouldEscalate: boolean;
  suggestedAction: string;
}

export async function analyzeSentiment(
  message: string,
  context?: string
): Promise<SentimentAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze the sentiment and urgency of this dispute/complaint message. 
    
Message: "${message}"
${context ? `Context: ${context}` : ""}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "sentiment": "positive|neutral|negative|hostile",
  "confidence": 0-100,
  "urgencyLevel": 1-5,
  "reasoning": "brief explanation",
  "shouldEscalate": true|false,
  "suggestedAction": "recommended action"
}

Rules:
- Sentiment: positive (friendly/satisfied), neutral (informational), negative (complaint), hostile (abusive/threatening)
- Confidence: How certain you are (0-100)
- Urgency: 1=routine, 2=standard, 3=elevated, 4=high, 5=critical/safety
- Escalate: true if urgency >= 3 or sentiment is hostile
- Action: Specific next step (e.g., "Route to manager", "Create urgent ticket", "Immediate callback required")`;

    const result = await model.generateContent(prompt);
    const responseText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find JSON object directly
      const objectMatch = responseText.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonText = objectMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText);

    return {
      sentiment: parsed.sentiment || "neutral",
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      urgencyLevel: Math.max(
        1,
        Math.min(5, parsed.urgencyLevel || 2)
      ) as 1 | 2 | 3 | 4 | 5,
      reasoning: parsed.reasoning || "Analysis complete",
      shouldEscalate: parsed.shouldEscalate || false,
      suggestedAction: parsed.suggestedAction || "Review and respond",
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    // Return neutral default on error
    return {
      sentiment: "neutral",
      confidence: 0,
      urgencyLevel: 2,
      reasoning: "Analysis unavailable",
      shouldEscalate: false,
      suggestedAction: "Manual review recommended",
    };
  }
}

export const sentimentAnalyzer = {
  analyzeSentiment,
};
