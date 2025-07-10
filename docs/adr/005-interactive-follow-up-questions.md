# ADR-005: Interactive Follow-up Questions Integration

## Status
Accepted

## Context
The AI Weekly Review feature was providing comprehensive insights about user performance, but lacked the ability for users to ask clarifying questions or dive deeper into specific aspects of their review. Users often have follow-up questions about:

- How to implement the suggested actionable tips
- Clarification on improvement areas
- Specific exercise or training recommendations
- Motivation and goal-setting advice
- Understanding their progress trends better

This one-way communication limited the value users could extract from their weekly reviews and missed opportunities for personalized coaching conversations.

## Decision
We will integrate interactive follow-up questions into the `AIWeeklyReviewCard` component, allowing users to ask questions about their weekly review and receive contextual AI-generated responses.

### Implementation Details

**Server Action Enhancement:**
- New `getAIWeeklyReviewFollowUp()` server action for handling follow-up questions
- Contextual LLM prompting that includes the original weekly review data
- User profile integration for personalized responses
- Proper authentication and error handling

**Frontend Component Enhancement:**
- Collapsible follow-up section with toggle functionality
- Question input with keyboard shortcuts (Enter to submit)
- Conversation history display showing Q&A pairs
- Suggested starter questions for user guidance
- Loading states and comprehensive error handling

**User Experience Design:**
- **Conversation Flow**: Questions and answers displayed in chat-like format
- **Visual Hierarchy**: User questions in blue, AI responses in gray
- **Suggested Questions**: Pre-written prompts to help users get started
- **Progressive Disclosure**: Collapsible interface to avoid overwhelming the main review

**LLM Prompt Engineering:**
- Context-aware prompting that references the original weekly review
- Maintains consistent coaching tone and personality
- Focused on fitness, training, and wellness topics
- Concise but thorough responses (2-4 sentences)
- Actionable advice that builds upon the weekly review insights

## Consequences

### Positive
- **Enhanced User Engagement**: Users can have deeper conversations about their fitness progress
- **Personalized Coaching**: Follow-up responses are tailored to both the review and user's specific questions
- **Educational Value**: Users can learn more about fitness concepts and training principles
- **Clarification Opportunity**: Users can get help understanding or implementing recommendations
- **Conversation History**: Users can see their previous questions and responses in the same session
- **Guided Discovery**: Suggested questions help users explore relevant topics

### Neutral
- **Increased Complexity**: Additional state management and UI components
- **Session-Based**: Follow-up history is only maintained during the current session
- **Additional API Calls**: Each follow-up question requires a separate LLM call

### Negative
- **No Persistence**: Follow-up conversations are lost when the page is refreshed
- **LLM Costs**: Additional token usage for follow-up question processing
- **Potential Scope Creep**: Users might ask questions outside fitness domain

## Technical Implementation

**New Server Action:**
```typescript
export async function getAIWeeklyReviewFollowUp(
  originalReview: AIWeeklyReview,
  userQuestion: string
): Promise<AIWeeklyReviewFollowUp | { error: string }>
```

**New Interface:**
```typescript
export interface AIWeeklyReviewFollowUp {
  question: string
  answer: string
}
```

**Component State Management:**
- `showFollowUp`: Controls visibility of follow-up section
- `followUpQuestion`: Current question input
- `followUpHistory`: Array of Q&A pairs for the session
- `followUpLoading`: Loading state for follow-up requests
- `followUpError`: Error handling for follow-up requests

**Key Features:**
- Enter key submission for quick question asking
- Suggested questions to guide user exploration
- Conversation history with clear visual distinction
- Collapsible interface to maintain focus on main review
- Comprehensive error handling and loading states

## Implementation Notes
- Follow-up conversations are session-based and not persisted to database
- LLM prompt includes full weekly review context for relevant responses
- Authentication required for all follow-up requests
- Responses are focused on fitness/wellness topics only
- Error handling ensures graceful degradation if follow-up service fails

## Future Enhancements
- **Conversation Persistence**: Store follow-up conversations in database
- **Question Categories**: Organize suggested questions by topic (training, nutrition, motivation)
- **Voice Input**: Allow users to ask questions via voice commands
- **Follow-up Notifications**: Remind users to ask follow-up questions
- **Advanced Context**: Include recent workout data in follow-up responses
- **Multi-turn Conversations**: Allow references to previous questions in the conversation

## Related
- Builds upon existing AI Weekly Review feature (ADR-002)
- Enhances user engagement with AI coaching system
- Utilizes existing LLM service infrastructure
- Supports the overall interactive AI Coach architecture 