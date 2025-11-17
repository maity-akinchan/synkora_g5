# AI Chatbot Guide

## Overview

The Synkora AI Assistant is an intelligent chatbot that helps you manage your projects, tasks, and team collaboration. It's available on every Kanban board and provides contextual assistance based on your project data.

## Features

### 1. **Context-Aware Assistance**
The AI assistant has access to:
- Your project name and description
- Current tasks and their status
- Team members and collaboration info
- Task priorities and deadlines

### 2. **Smart Responses**
The chatbot can help with:
- Task management strategies
- Project organization tips
- Team collaboration advice
- Workflow optimization
- Analytics interpretation
- Feature guidance

### 3. **Persistent Chat History**
- All conversations are saved per project
- Access your chat history anytime
- Continue conversations across sessions

## How to Use

### Opening the Chatbot

1. **On Kanban Board**: Look for the green floating bot icon in the bottom-right corner
2. **Click the Icon**: The chat window will open
3. **Start Chatting**: Type your question and press Enter or click Send

### Example Questions

**Task Management:**
- "How should I organize my tasks?"
- "What's the best way to prioritize work?"
- "How many tasks do I have?"
- "Help me create a task workflow"

**Team Collaboration:**
- "How can my team collaborate better?"
- "What collaboration features are available?"
- "How do I assign tasks to team members?"

**Project Planning:**
- "Give me an overview of this project"
- "What should I focus on first?"
- "How can I track project progress?"

**Analytics:**
- "Show me project metrics"
- "How is my team performing?"
- "What analytics are available?"

**General Help:**
- "What can you help me with?"
- "How do I use the Kanban board?"
- "What features does Synkora have?"

## AI Configuration

### Using OpenAI (Recommended)

For the best experience, configure OpenAI API:

1. **Get an API Key**
   - Sign up at https://platform.openai.com/
   - Create an API key in your account settings

2. **Add to Environment Variables**
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Restart the Server**
   ```bash
   npm run dev
   ```

### Fallback Mode

If no OpenAI API key is configured, the chatbot uses rule-based responses:
- Still helpful and contextual
- Faster responses
- No API costs
- Limited to predefined patterns

## Features by Mode

### With OpenAI API
✅ Natural language understanding
✅ Context-aware conversations
✅ Creative problem-solving
✅ Detailed explanations
✅ Follow-up questions
✅ Personalized advice

### Fallback Mode (No API Key)
✅ Quick responses
✅ Common task management tips
✅ Feature explanations
✅ Basic project guidance
⚠️ Limited conversation flow
⚠️ Pattern-based responses

## Privacy & Data

### What the AI Knows
- Your project name and description
- Task titles, statuses, and priorities (last 20 tasks)
- Team member count and names
- Your chat history with the bot

### What the AI Doesn't Know
- Task descriptions (for privacy)
- Personal information beyond project context
- Other users' private data
- Information from other projects

### Data Storage
- Chat messages are stored in your database
- Messages are linked to your user ID and project ID
- Only you can see your chat history
- Messages are not shared with other users

## Tips for Best Results

### 1. **Be Specific**
❌ "Help me"
✅ "How should I prioritize my high-priority tasks?"

### 2. **Provide Context**
❌ "What should I do?"
✅ "I have 15 tasks in progress. How can I organize them better?"

### 3. **Ask Follow-up Questions**
The AI remembers your conversation, so you can:
- Ask for clarification
- Request more details
- Build on previous answers

### 4. **Use Natural Language**
You don't need special commands. Just ask naturally:
- "Can you explain the analytics dashboard?"
- "What's the best way to use the Kanban board?"
- "How do I invite team members?"

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Esc**: Close chat window (when input is empty)

## Troubleshooting

### "I'm not getting responses"

**Check:**
1. Internet connection is active
2. You're logged in
3. The project exists and you have access
4. Server is running

**Try:**
- Refresh the page
- Close and reopen the chat
- Check browser console for errors

### "Responses are slow"

**Possible causes:**
- OpenAI API is processing (can take 2-5 seconds)
- Network latency
- Server load

**Solutions:**
- Wait a moment longer
- Check your internet connection
- Try again if it times out

### "Responses seem generic"

**If using OpenAI:**
- The AI might need more context
- Try being more specific in your questions
- Provide details about your situation

**If using fallback mode:**
- This is expected behavior
- Consider adding an OpenAI API key for better responses
- The bot will still provide helpful guidance

## Technical Details

### API Endpoints

**Get Chat History:**
```
GET /api/projects/[projectId]/ai-chat
```

**Send Message:**
```
POST /api/projects/[projectId]/ai-chat
Body: { message: string, history: Message[] }
```

### Database Schema

```prisma
model AIMessage {
  id        String   @id @default(cuid())
  userId    String
  projectId String?
  role      String   // 'user' or 'assistant'
  content   String   @db.Text
  context   Json?
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

### Component Usage

```tsx
import { ProjectAIAssistant } from "@/components/chatbot/project-ai-assistant";

<ProjectAIAssistant 
  projectId={projectId} 
  projectName={projectName} 
/>
```

## Future Enhancements

Planned features:
- Voice input/output
- Task creation via chat
- Proactive suggestions
- Team-wide chat
- Integration with other tools
- Custom AI training on your data

## Support

If you encounter issues:
1. Check this guide
2. Review the console for errors
3. Verify your API key (if using OpenAI)
4. Check server logs
5. Report bugs with details about what happened

## Best Practices

### For Team Leads
- Use the AI to plan sprints
- Ask for team productivity insights
- Get suggestions for task distribution
- Learn about analytics features

### For Developers
- Ask about task priorities
- Get workflow optimization tips
- Learn keyboard shortcuts
- Understand feature usage

### For Project Managers
- Track project progress
- Get overview summaries
- Learn about collaboration tools
- Optimize team workflows

---

**Remember:** The AI assistant is here to help, not replace your judgment. Use it as a tool to enhance your productivity and project management skills!
