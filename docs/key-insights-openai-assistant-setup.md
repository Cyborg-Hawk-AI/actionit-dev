
# Key Insights OpenAI Assistant Setup Guide

## Overview

This document provides the configuration instructions for setting up the OpenAI Assistant that generates key insights from multiple meeting summaries. This assistant is separate from the individual meeting analysis assistant and is specifically designed to analyze patterns and extract insights across multiple meetings from the last 7 days.

## Assistant Configuration

### Basic Settings

**Name**: Action.IT Key Insights Analyzer
**Model**: gpt-4o or gpt-4o-mini (recommended for cost efficiency)
**Description**: Analyzes multiple meeting summaries to extract key insights, action items, and decisions across a 7-day period.

### System Instructions

```
You are an AI assistant for Action.IT that specializes in analyzing multiple meeting summaries to extract key insights across a user's meetings from the last 7 days.

Your task is to analyze a collection of meeting summaries and identify:
1. Overarching themes and patterns
2. Recurring action items and their status
3. Key decisions that impact multiple meetings or projects
4. Strategic insights that emerge from the collective meetings

When given multiple meeting summaries, you must analyze them and return a JSON object with exactly this structure:

{
  "insight_summary": "A comprehensive 3-4 sentence summary highlighting the main themes, patterns, and strategic insights that emerge across all the meetings. Focus on connecting dots between different meetings and identifying overarching trends.",
  "action_items": [
    "Specific actionable items that are either recurring across meetings or have strategic importance",
    "Follow-up tasks that span multiple meetings or projects",
    "Action items that require coordination between different meetings/teams"
  ],
  "decisions": [
    "Key strategic decisions made across the meetings",
    "Important policy or direction changes",
    "Decisions that impact multiple projects or meetings",
    "Resource allocation or priority decisions"
  ]
}

Important requirements:
- Always return valid JSON with exactly the three fields shown above
- The insight_summary should be a single string (not an array)
- action_items and decisions should be arrays of strings
- If no items exist for action_items or decisions, return empty arrays []
- Focus on cross-meeting patterns, not individual meeting details
- Prioritize strategic insights over tactical details
- Do not include conversational text, only the JSON response
- Look for patterns like: recurring themes, escalating issues, progress on long-term goals, team dynamics, resource constraints, changing priorities

Example patterns to identify:
- "The team consistently struggles with resource allocation across multiple projects"
- "There's a recurring theme of technical debt impacting delivery timelines"
- "Leadership decisions are shifting priority from feature development to platform stability"
- "Cross-team communication gaps are emerging as a critical blocker"
```

### Tools and Features

- **Tools**: None required
- **File Search**: Disabled
- **Code Interpreter**: Disabled
- **Function Calling**: Disabled

## Environment Variables Required

Add these to your Supabase Edge Functions secrets:

```
OPENAI_API_KEY=sk-proj-...your-openai-api-key
OPENAI_KEY_INSIGHTS_ASSISTANT_ID=asst_...your-key-insights-assistant-id
```

## Expected Input Format

The assistant receives combined meeting summaries in this format:

```
Meeting 1 (12/6/2024):
Weekly standup discussing project Alpha progress. Team reported 80% completion on backend API development. Frontend team blocked on design reviews. Decided to prioritize API documentation for next sprint.

---

Meeting 2 (12/7/2024):
Product planning session for Q1 2025. Discussed shifting focus from new features to platform stability. Leadership concerned about technical debt. Action item: Conduct technical debt assessment by end of month.

---

Meeting 3 (12/8/2024):
Design review meeting for new user interface. Frontend team still waiting on design approval from previous meetings. Bottleneck identified in design review process. Decision made to streamline approval workflow.
```

## Expected Output Structure

```json
{
  "insight_summary": "Across the week's meetings, a clear pattern emerges around process bottlenecks and shifting priorities. The organization is transitioning from feature development to platform stability, while simultaneously identifying workflow inefficiencies that are impacting delivery timelines. There's a strategic shift toward addressing technical debt and process optimization.",
  "action_items": [
    "Conduct comprehensive technical debt assessment by end of month",
    "Streamline design review and approval workflow to eliminate recurring bottlenecks",
    "Prioritize API documentation to unblock frontend development",
    "Establish clear communication channels between design and development teams"
  ],
  "decisions": [
    "Shift organizational focus from new feature development to platform stability for Q1 2025",
    "Prioritize technical debt reduction over new feature development",
    "Implement streamlined design approval workflow to reduce project delays",
    "Allocate resources for comprehensive technical debt assessment"
  ]
}
```

## Data Flow

1. **Trigger**: New meeting summary added to transcripts table
2. **Collection**: System fetches all meeting summaries for the user from last 7 days
3. **Combination**: All summaries combined into single text with meeting separators
4. **Analysis**: Text sent to Key Insights Assistant
5. **Processing**: Assistant analyzes for patterns and strategic insights
6. **Storage**: Parsed JSON response stored in key_insights table

## Key Differences from Individual Meeting Analysis

| Aspect | Individual Meeting | Key Insights |
|--------|-------------------|--------------|
| **Scope** | Single meeting | 7 days of meetings |
| **Focus** | Meeting-specific details | Cross-meeting patterns |
| **Output** | Detailed meeting breakdown | Strategic insights |
| **Frequency** | Per meeting | When new summary added |
| **Assistant** | OPENAI_ASSISTANT_ID | OPENAI_KEY_INSIGHTS_ASSISTANT_ID |

## Troubleshooting

### Common Issues

1. **"Assistant not found"**
   - Verify OPENAI_KEY_INSIGHTS_ASSISTANT_ID is correctly set
   - Ensure the assistant exists in your OpenAI account

2. **"Invalid JSON response"**
   - Review assistant instructions for JSON formatting requirements
   - Check OpenAI playground with sample input

3. **"No insights generated"**
   - Verify user has meeting summaries in the last 7 days
   - Check transcripts table for meeting_summary values

### Monitoring

Check the edge function logs for detailed processing information:
- Supabase Dashboard > Edge Functions > generate-key-insights > Logs

### Testing

Test the assistant directly in OpenAI Playground with sample combined summaries to verify output format before deploying.

## Cost Considerations

- **Model**: Use gpt-4o-mini for cost efficiency
- **Frequency**: Runs only when new meeting summaries are added
- **Token Usage**: Proportional to number of meetings in 7-day window
- **Optimization**: Consider batching if user has many meetings per day

## Security

- Assistant operates on anonymized meeting summaries
- No personally identifiable information should be included in summaries
- API keys secured in Supabase Edge Function secrets
- Background processing ensures no blocking of user workflows
