import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects/[id]/ai-chat - Get chat history
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get recent messages for this project
        const messages = await prisma.aIMessage.findMany({
            where: {
                userId: session.user.id,
                projectId: params.id,
            },
            orderBy: {
                createdAt: "asc",
            },
            take: 50, // Last 50 messages
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/ai-chat - Send message to AI
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { message, history } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Get project context
        const project = await prisma.project.findUnique({
            where: { id: params.id },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                    take: 20,
                },
                team: {
                    select: {
                        name: true,
                        members: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Build context for AI
        const taskSummary = project.tasks.length > 0
            ? `Current tasks:\n${project.tasks
                .map(
                    (t) =>
                        `- ${t.title} (${t.status}, ${t.priority} priority)`
                )
                .join("\n")}`
            : "No tasks yet.";

        const teamInfo = project.team
            ? `Team: ${project.team.name} with ${project.team.members.length} members`
            : "Personal project";

        // Save user message
        await prisma.aIMessage.create({
            data: {
                userId: session.user.id,
                projectId: params.id,
                role: "user",
                content: message,
            },
        });

        // Generate AI response
        const aiResponse = await generateAIResponse(
            message,
            history || [],
            {
                projectName: project.name,
                projectDescription: project.description || "",
                taskSummary,
                teamInfo,
            }
        );

        // Save assistant message
        await prisma.aIMessage.create({
            data: {
                userId: session.user.id,
                projectId: params.id,
                role: "assistant",
                content: aiResponse,
            },
        });

        return NextResponse.json({ response: aiResponse });
    } catch (error) {
        console.error("Error processing AI chat:", error);
        return NextResponse.json(
            { error: "Failed to process message" },
            { status: 500 }
        );
    }
}

// Helper function to generate AI response
async function generateAIResponse(
    message: string,
    history: Array<{ role: string; content: string }>,
    context: {
        projectName: string;
        projectDescription: string;
        taskSummary: string;
        teamInfo: string;
    }
): Promise<string> {
    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        // Fallback to rule-based responses if no API key
        return generateFallbackResponse(message, context);
    }

    try {
        const systemPrompt = `You are a helpful AI assistant for a project management platform called Synkora. 
You help users manage their projects, tasks, and team collaboration.

Current project context:
- Project: ${context.projectName}
- Description: ${context.projectDescription || "No description"}
- ${context.teamInfo}
- ${context.taskSummary}

Provide helpful, concise, and actionable advice. Be friendly and professional.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10).map((h) => ({
                role: h.role,
                content: h.content,
            })),
            { role: "user", content: message },
        ];

        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages,
                    max_tokens: 500,
                    temperature: 0.7,
                }),
            }
        );

        if (!response.ok) {
            throw new Error("OpenAI API request failed");
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return generateFallbackResponse(message, context);
    }
}

// Fallback response generator (rule-based)
function generateFallbackResponse(
    message: string,
    context: {
        projectName: string;
        projectDescription: string;
        taskSummary: string;
        teamInfo: string;
    }
): string {
    const lowerMessage = message.toLowerCase();

    // Task-related queries
    if (lowerMessage.includes("task") || lowerMessage.includes("todo")) {
        if (lowerMessage.includes("how many") || lowerMessage.includes("count")) {
            const taskCount = context.taskSummary.split("\n").length - 1;
            return `You currently have ${taskCount} tasks in ${context.projectName}. ${taskCount > 10
                    ? "Consider prioritizing the most important ones!"
                    : "Great job keeping your task list manageable!"
                }`;
        }
        if (lowerMessage.includes("create") || lowerMessage.includes("add")) {
            return `To create a new task in ${context.projectName}, click the "Add Task" button on your Kanban board. You can set the title, description, priority, and assign it to team members.`;
        }
        if (lowerMessage.includes("organize") || lowerMessage.includes("manage")) {
            return `Here are some tips for managing tasks in ${context.projectName}:
1. Use the Kanban board to visualize your workflow
2. Set priorities (High, Medium, Low) for each task
3. Assign tasks to specific team members
4. Use due dates to track deadlines
5. Move tasks through columns as they progress`;
        }
    }

    // Team-related queries
    if (lowerMessage.includes("team") || lowerMessage.includes("member") || lowerMessage.includes("collaborate")) {
        return `${context.teamInfo}. You can collaborate by:
- Assigning tasks to team members
- Using the video meeting feature for real-time discussions
- Tracking team activity in the analytics dashboard
- Sharing updates through task comments`;
    }

    // Project-related queries
    if (lowerMessage.includes("project") || lowerMessage.includes("overview")) {
        return `You're working on "${context.projectName}". ${context.projectDescription
                ? `Description: ${context.projectDescription}`
                : ""
            }

Available features:
- Kanban board for task management
- Git integration for code tracking
- Collaborative canvas for brainstorming
- Analytics dashboard for insights
- Video meetings for team calls`;
    }

    // Analytics queries
    if (lowerMessage.includes("analytic") || lowerMessage.includes("progress") || lowerMessage.includes("metric")) {
        return `Check out the Analytics page to see:
- Task completion rates
- Team productivity metrics
- Activity timeline
- Task distribution by status and priority

This helps you track progress and identify bottlenecks in ${context.projectName}.`;
    }

    // Help queries
    if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("how") ||
        lowerMessage.includes("what can you")
    ) {
        return `I can help you with:
- Managing tasks and organizing your Kanban board
- Team collaboration and communication tips
- Project planning and prioritization
- Understanding analytics and metrics
- Using Synkora features effectively

Just ask me anything about ${context.projectName}!`;
    }

    // Default response
    return `I'm here to help with ${context.projectName}! I can assist with:
- Task management and organization
- Team collaboration strategies
- Project planning and priorities
- Analytics and progress tracking

What would you like to know?`;
}
