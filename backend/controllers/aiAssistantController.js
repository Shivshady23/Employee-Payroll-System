const Anthropic = require("@anthropic-ai/sdk");

const { payrollTools } = require("../utils/aiTools");
const { executeAITool } = require("../utils/executeAITool");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a smart HR and payroll assistant built into the Employee Payroll System.
You help admins and superadmins manage employees, understand salary structures, and get payroll insights.

Your capabilities:
- Query live employee and salary data from the database using tools
- Create or update salary structures for employees
- Explain PF, ESIC, pension calculations with exact numbers
- Find employees with missing salary, or employees who joined recently
- Draft professional HR emails (welcome emails, offer letters, reminders)
- Summarize payroll data and give actionable insights

PF/ESIC Rules you follow exactly:
- Employee PF = 12% of Basic salary
- Employer PF = 12% of Basic (split: 3.67% EPF + 8.33% Pension)
- ESIC applicable only if total earnings <= INR 21,000/month
- Employee ESIC = 0.75% of total earnings
- Employer ESIC = 3.25% of total earnings
- Net Pay = Total Earnings - Employee PF - Employee ESIC

Tone: Professional, concise, and helpful. When showing numbers, use ₹ symbol with comma formatting.
When listing employees, use a clean table-style format in markdown.
Always confirm before creating or modifying data.`;

const MAX_TOOL_LOOPS = 8;

const normalizeIncomingMessages = messages =>
  messages
    .filter(item => item && (item.role === "user" || item.role === "assistant"))
    .map(item => ({
      role: item.role,
      content: typeof item.content === "string" ? item.content : JSON.stringify(item.content)
    }));

const extractText = contentBlocks =>
  (contentBlocks || [])
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "ANTHROPIC_API_KEY is missing on the server"
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "messages array required"
      });
    }

    let currentMessages = normalizeIncomingMessages(messages);
    let finalResponse = "";
    let loopCount = 0;

    while (loopCount < MAX_TOOL_LOOPS) {
      loopCount += 1;

      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: payrollTools,
        messages: currentMessages
      });

      const replyText = extractText(response.content);
      if (replyText) {
        finalResponse = replyText;
      }

      if (response.stop_reason === "end_turn") {
        break;
      }

      if (response.stop_reason === "tool_use") {
        currentMessages.push({ role: "assistant", content: response.content });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            const result = await executeAITool(block.name, block.input, {
              performedBy: req.user?.id || null
            });

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result)
            });
          }
        }

        currentMessages.push({
          role: "user",
          content: toolResults
        });
        continue;
      }

      break;
    }

    return res.status(200).json({
      success: true,
      reply:
        finalResponse ||
        "I could not generate a response right now. Please try rephrasing your request."
    });
  } catch (err) {
    console.error("AI Assistant error:", err);
    return res.status(500).json({
      success: false,
      message: "AI assistant error",
      error: err.message
    });
  }
};
