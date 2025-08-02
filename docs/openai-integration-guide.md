
# OpenAI Integration Guide for Action.IT

## Overview

Action.IT uses OpenAI's Assistants API to analyze meeting transcripts and generate structured insights. This document provides a comprehensive overview of how the OpenAI integration works, including data flow, API calls, prompts, responses, and troubleshooting.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [OpenAI Assistant Configuration](#openai-assistant-configuration)
3. [Data Flow](#data-flow)
4. [API Implementation Details](#api-implementation-details)
5. [Payload Examples](#payload-examples)
6. [Response Structure](#response-structure)
7. [Error Handling](#error-handling)
8. [Troubleshooting](#troubleshooting)
9. [Configuration Guide](#configuration-guide)

## Architecture Overview

The OpenAI integration in Action.IT follows this flow:

```
Meeting Transcript → Supabase Edge Function → OpenAI Assistants API → Structured Analysis → Database Storage
```

### Key Components

- **Supabase Edge Function**: `process-transcripts`
- **OpenAI API**: Assistants API v2
- **Assistant Model**: Configured OpenAI Assistant with specific instructions
- **Database Storage**: Structured analysis stored in `transcripts.open_ai_analysis`

## OpenAI Assistant Configuration

### Required Environment Variables

```
OPENAI_API_KEY=sk-...your-openai-api-key
OPENAI_ASSISTANT_ID=asst_...your-assistant-id
```

### Assistant Setup

Your OpenAI Assistant should be configured with:

**Name**: Action.IT Meeting Analyzer
**Model**: gpt-4o or gpt-4o-mini (recommended for cost efficiency)
**Instructions**: 

```
You are an AI meeting assistant for Action.IT. Your job is to analyze meeting transcripts and extract structured insights.

When given a meeting transcript, you must analyze it and return a JSON object with the following structure:

{
  "summary": "A concise 2-3 sentence summary of the meeting",
  "key_points": ["List", "of", "main", "discussion", "points"],
  "action_items": ["Specific", "actionable", "tasks", "identified"],
  "decisions": ["Key", "decisions", "made", "during", "meeting"],
  "follow_ups": ["Items", "requiring", "future", "attention"]
}

Requirements:
- Always return valid JSON
- Keep summary concise but informative
- Extract specific, actionable items for action_items
- Include clear decisions made during the meeting
- Identify items that need follow-up
- If no items exist for a category, return an empty array []
- Do not include conversational text, only the JSON response
```

**Tools**: None required
**File Search**: Disabled
**Code Interpreter**: Disabled

## Data Flow

### 1. Transcript Processing Initiation

```typescript
// From transcriptService.ts
export async function processTranscript(transcriptId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('process-transcripts', {
    body: { transcriptId }
  });
}
```

### 2. Edge Function Processing

The `process-transcripts` edge function handles the complete flow:

1. **Fetch Transcript Data** from database
2. **Download Transcript Text** from Recall.ai
3. **Send to OpenAI Assistant** for analysis
4. **Store Results** back in database

### 3. OpenAI API Communication

The edge function uses the OpenAI Assistants API v2 with these steps:

1. **Create Thread**: Creates a conversation thread
2. **Add Message**: Sends the transcript as a user message
3. **Run Assistant**: Executes the assistant on the thread
4. **Poll for Completion**: Waits for analysis to complete
5. **Retrieve Response**: Gets the structured analysis

## API Implementation Details

### Thread Creation

```typescript
const threadResponse = await fetch('https://api.openai.com/v1/threads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openAIApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
  body: JSON.stringify({}),
});
```

### Message Addition

```typescript
const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openAIApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
  body: JSON.stringify({
    role: 'user',
    content: transcriptText, // Raw transcript without additional prompts
  }),
});
```

### Assistant Execution

```typescript
const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openAIApiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  },
  body: JSON.stringify({
    assistant_id: openAIAssistantId,
  }),
});
```

### Status Polling

```typescript
// Poll every 5 seconds, max 60 attempts (5 minutes)
while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  });
}
```

## Payload Examples

### Input Transcript Format

The transcript text sent to OpenAI is raw text extracted from Recall.ai:

```
Speaker 1: Good morning everyone, let's start our weekly standup.
Speaker 2: Thanks for organizing this. I wanted to discuss the progress on the new feature.
Speaker 1: Great, what's the current status?
Speaker 2: We've completed the backend implementation and are now working on the frontend. We should have it ready for testing by Friday.
Speaker 1: Excellent. Any blockers?
Speaker 2: Yes, we need design approval for the user interface. Can we schedule a review with the design team?
Speaker 1: I'll coordinate that. Let's make sure we get feedback by Wednesday.
```

### OpenAI Assistant Request

```json
{
  "assistant_id": "asst_ABC123...",
  "thread": {
    "messages": [
      {
        "role": "user",
        "content": "Speaker 1: Good morning everyone..."
      }
    ]
  }
}
```

## Response Structure

### Expected OpenAI Response Format

```json
{
  "summary": "Weekly standup meeting discussing progress on new feature development, with backend completed and frontend in progress.",
  "key_points": [
    "Backend implementation completed for new feature",
    "Frontend development currently in progress",
    "Testing scheduled for Friday",
    "Design review needed for user interface"
  ],
  "action_items": [
    "Schedule design review with design team",
    "Complete frontend development by Friday",
    "Conduct feature testing after frontend completion"
  ],
  "decisions": [
    "Design feedback must be received by Wednesday",
    "Feature testing will begin Friday"
  ],
  "follow_ups": [
    "Coordinate design team review meeting",
    "Monitor frontend development progress",
    "Prepare test cases for Friday testing"
  ]
}
```

### Database Storage Format

The response is stored in the `transcripts` table:

```sql
-- transcripts.open_ai_analysis column (JSONB)
{
  "summary": "Meeting summary text",
  "key_points": ["Array", "of", "key", "points"],
  "action_items": ["Array", "of", "action", "items"],
  "decisions": ["Array", "of", "decisions"],
  "follow_ups": ["Array", "of", "follow", "ups"]
}
```

### TypeScript Interface

```typescript
export interface TranscriptAnalysis {
  summary: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
  follow_ups: string[];
}
```

## Error Handling

### Common Error Scenarios

1. **Assistant Not Found**
   ```json
   {
     "error": "Assistant not found",
     "message": "OPENAI_ASSISTANT_ID not configured or invalid"
   }
   ```

2. **Rate Limiting**
   ```json
   {
     "error": "Rate limit exceeded",
     "message": "Too many requests to OpenAI API"
   }
   ```

3. **Invalid Response Format**
   ```typescript
   // Fallback structure when JSON parsing fails
   {
     "summary": responseText, // Raw text response
     "key_points": [],
     "action_items": [],
     "decisions": [],
     "follow_ups": []
   }
   ```

### Error Recovery

The system implements graceful degradation:

1. **JSON Parse Errors**: Falls back to storing raw text in summary
2. **API Timeouts**: Retries with exponential backoff
3. **Missing Fields**: Provides default empty arrays
4. **Authentication Errors**: Logs detailed error information

## Troubleshooting

### Common Issues and Solutions

#### 1. "No assistant response found"

**Cause**: Assistant run completed but no messages returned
**Solution**: 
- Check assistant configuration in OpenAI dashboard
- Verify assistant instructions are set correctly
- Ensure assistant has proper permissions

#### 2. "Assistant run did not complete successfully"

**Cause**: OpenAI processing timeout or failure
**Solution**:
- Check OpenAI API status
- Verify transcript length (very long transcripts may timeout)
- Review OpenAI usage limits

#### 3. "Response is not JSON"

**Cause**: Assistant returning conversational text instead of JSON
**Solution**:
- Update assistant instructions to emphasize JSON-only responses
- Add examples in assistant instructions
- Consider adjusting assistant temperature settings

#### 4. Inconsistent Analysis Quality

**Cause**: Assistant model or instructions need refinement
**Solution**:
- Provide more specific instructions
- Add examples of good vs. bad responses
- Consider upgrading to gpt-4o model for better accuracy

### Debugging Steps

1. **Check Edge Function Logs**
   ```bash
   # View logs in Supabase dashboard
   # Look for process-transcripts function logs
   ```

2. **Verify Environment Variables**
   ```typescript
   console.log('OpenAI API Key exists:', !!openAIApiKey);
   console.log('Assistant ID:', openAIAssistantId);
   ```

3. **Test Assistant Directly**
   - Use OpenAI Playground to test assistant with sample transcript
   - Verify response format matches expected structure

4. **Database Verification**
   ```sql
   SELECT 
     id,
     transcript_text IS NOT NULL as has_transcript,
     open_ai_analysis IS NOT NULL as has_analysis,
     open_ai_analysis->>'summary' as summary_preview
   FROM transcripts 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC;
   ```

## Configuration Guide

### Setting Up OpenAI Assistant

1. **Create Assistant** in OpenAI Dashboard
2. **Configure Instructions** (use template above)
3. **Set Model** (gpt-4o-mini recommended)
4. **Copy Assistant ID** to environment variables

### Environment Configuration

In Supabase Edge Function Secrets:

```
OPENAI_API_KEY=sk-proj-...your-api-key
OPENAI_ASSISTANT_ID=asst_...your-assistant-id
```

### Testing the Integration

1. **Create Test Meeting** with known transcript
2. **Trigger Processing** via calendar or manual API call
3. **Verify Results** in database and frontend
4. **Check Logs** for any errors or warnings

### Performance Optimization

- **Model Selection**: Use gpt-4o-mini for faster, cheaper processing
- **Transcript Length**: Consider chunking very long transcripts
- **Caching**: Implement response caching for repeated analyses
- **Batch Processing**: Process multiple transcripts in parallel

## API Rate Limits and Costs

### OpenAI Limits

- **gpt-4o-mini**: 200 requests/minute, ~$0.0015 per 1K tokens
- **gpt-4o**: 10,000 requests/minute, ~$0.03 per 1K tokens
- **Assistants API**: Additional small fee per run

### Cost Estimation

Average meeting transcript (5,000 tokens):
- **gpt-4o-mini**: ~$0.008 per analysis
- **gpt-4o**: ~$0.15 per analysis

## Security Considerations

1. **API Key Protection**: Never expose in frontend code
2. **User Data**: Transcripts sent to OpenAI (review OpenAI data policy)
3. **Response Validation**: Always validate and sanitize AI responses
4. **Rate Limiting**: Implement application-level rate limiting

## Future Improvements

1. **Streaming Responses**: Implement real-time analysis updates
2. **Custom Models**: Fine-tune models for meeting-specific analysis
3. **Multi-language Support**: Handle non-English transcripts
4. **Advanced Analytics**: Sentiment analysis, speaker insights
5. **Integration Options**: Export to task management tools

---

This document should be updated as the OpenAI integration evolves. For the most current API documentation, refer to [OpenAI's official documentation](https://platform.openai.com/docs).
