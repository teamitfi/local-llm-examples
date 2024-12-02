import { Ollama } from "ollama";
import { Logger } from "../src/utils/logger";

const logger = new Logger("Ollama Client");

interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface ToolCall {
  name: string;
  parameters: Record<string, unknown>;
}

const tools: Tool[] = [
  {
    name: "search_documents",
    description: "Search through the loaded documents for specific information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_documents",
    description: "List all available documents",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

const systemPrompt = `You are a helpful AI assistant with access to the following tools:

${tools.map((tool) => `${tool.name}: ${tool.description}`).join("\n")}

To use a tool, respond in the following JSON format:
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1"
  }
}

Only respond with valid JSON that matches this format. Do not include any other text in your response.`;

function parseToolCall(response: string): ToolCall | null {
  try {
    const parsed = JSON.parse(response.trim());
    if (
      typeof parsed.tool === "string" &&
      typeof parsed.parameters === "object"
    ) {
      return {
        name: parsed.tool,
        parameters: parsed.parameters,
      };
    }
  } catch (error) {
    logger.error("Failed to parse tool call:", error);
  }
  return null;
}

export class OllamaClient {
  private ollama: Ollama;
  public readonly model: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.ollama = new Ollama({ host: baseUrl });
    this.model = "tinyllama:latest";
  }

  async chat(message: string): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      const toolCall = parseToolCall(response.message.content);
      if (!toolCall) {
        return "Failed to parse tool call from response";
      }

      // Handle tool calls
      switch (toolCall.name) {
        case "search_documents":
          return `Would search documents with query: ${toolCall.parameters.query}`;
        case "list_documents":
          return "Would list available documents";
        default:
          return `Unknown tool: ${toolCall.name}`;
      }
    } catch (error) {
      logger.error("Error in chat:", error);
      return "Error processing chat message";
    }
  }

  async pullModel(): Promise<void> {
    try {
      await this.ollama.pull({ model: this.model, stream: false });
      logger.info(`Successfully pulled model ${this.model}`);
    } catch (error) {
      logger.error("Error pulling model:", error);
      throw error;
    }
  }

  generate(prompt: string): Promise<string> {
    try {
      return this.ollama
        .generate({
          model: this.model,
          prompt: prompt,
          stream: false,
        })
        .then((response) => response.response);
    } catch (error) {
      logger.error("Error generating response:", error);
      return Promise.resolve("Error generating response");
    }
  }

  async embeddings(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text,
      });
      return response.embedding;
    } catch (error) {
      logger.error("Error getting embeddings:", error);
      return [];
    }
  }

  async analyzeImage(
    imagePath: string,
    prompt: string = "describe this image:"
  ): Promise<string> {
    try {
      let fullResponse = "";
      const response = await this.ollama.generate({
        model: "llava",
        prompt,
        images: [imagePath],
        stream: true,
      });

      for await (const part of response) {
        fullResponse += part.response;
      }

      return fullResponse;
    } catch (error) {
      logger.error("Error analyzing image:", error);
      throw error;
    }
  }
}

// Example usage
async function main() {
  const client = new OllamaClient();

  // Example chat with tool usage
  const chatResponse = await client.chat(
    "Can you search for documents about AI?"
  );
  logger.info("Chat response:", chatResponse);

  // Example direct generation
  const generateResponse = await client.generate("What is machine learning?");
  logger.info("Generate response:", generateResponse);

  // Example embeddings
  const embeddings = await client.embeddings("Example text for embeddings");
  logger.info("Embeddings length:", embeddings.length);
}

if (require.main === module) {
  main().catch((error) => {
    logger.error("Error in main:", error);
    process.exit(1);
  });
}
