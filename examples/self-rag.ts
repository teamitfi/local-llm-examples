import dotenv from "dotenv";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Annotation } from "@langchain/langgraph";
import { createRetrieverTool } from "langchain/tools/retriever";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  BaseMessage,
} from "@langchain/core/messages";

type ToolCall = {
  name: string;
  args: Record<string, any>;
};

interface EnhancedAIMessage extends AIMessage {
  tool_calls?: ToolCall[];
}

type Message = HumanMessage | EnhancedAIMessage | ToolMessage | BaseMessage;

type GraphStateType = typeof GraphState.State;

// Define the type for the output entries
type OutputEntry = {
  messages: {
    _getType: () => string;
    content: string;
    tool_calls?: any[];
  }[];
};

dotenv.config();

// Constants
const urls = [
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
  "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
  "https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/",
];

// Load documents
async function loadDocuments() {
  const docs = await Promise.all(
    urls.map((url) => new CheerioWebBaseLoader(url).load())
  );
  const docsList = docs.flat();
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  return textSplitter.splitDocuments(docsList);
}

// Setup retriever
async function setupRetriever(docsList: any) {
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docsList,
    new OpenAIEmbeddings()
  );
  return vectorStore.asRetriever();
}

// Agent state
const GraphState = Annotation.Root({
  messages: Annotation<Message[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

// Function to decide whether to retrieve or end
function shouldRetrieve(state: GraphStateType): string {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return "retrieve";
  }
  return END;
}
// Grading retrieved documents
async function gradeDocuments(
  state: GraphStateType
): Promise<Partial<typeof GraphState.State>> {
  const { messages } = state;
  const tool = {
    name: "give_relevance_score",
    description: "Give a relevance score to the retrieved documents.",
    schema: z.object({
      binaryScore: z.string().describe("Relevance score 'yes' or 'no'"),
    }),
  };

  const prompt = ChatPromptTemplate.fromTemplate(
    `You are a grader assessing relevance of retrieved docs to a user question.
    Here are the retrieved docs:
    {context}
    User question: {question}
    Score relevance as 'yes' or 'no'.`
  );

  const model = new ChatOpenAI({ model: "gpt-4", temperature: 0 }).bindTools(
    [tool],
    { tool_choice: tool.name }
  );

  const chain = prompt.pipe(model);

  const score = await chain.invoke({
    question: messages[0].content as string,
    context: messages[messages.length - 1].content as string,
  });

  return { messages: [score] };
}

// Check document relevance
function checkRelevance(state: GraphStateType): string {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolCalls = (lastMessage as AIMessage).tool_calls;
  if (toolCalls && toolCalls[0]?.args.binaryScore === "yes") {
    return "generate";
  }
  return "rewrite";
}

// Transform the query
async function rewrite(
  state: GraphStateType
): Promise<Partial<typeof GraphState.State>> {
  const { messages } = state;
  const question = messages[0].content as string;
  const prompt = ChatPromptTemplate.fromTemplate(
    `Rewrite the following question for better clarity:\n{question}`
  );

  const model = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
  const response = await prompt.pipe(model).invoke({ question });
  return { messages: [response] };
}

// Generate the final answer
async function generate(
  state: GraphStateType
): Promise<Partial<typeof GraphState.State>> {
  const { messages } = state;
  const question = messages[0].content as string;
  const docs = messages.reverse().find((msg) => msg._getType() === "tool")
    ?.content as string;

  const prompt = ChatPromptTemplate.fromTemplate(
    `Using the following context, answer the question:\n\n{context}\n\nQuestion: {question}`
  );

  const llm = new ChatOpenAI({ model: "gpt-4", temperature: 0 });

  const ragChain = prompt.pipe(llm);

  const response = await ragChain.invoke({ context: docs, question });

  return { messages: [response] };
}

// Workflow graph
async function setupGraph(retriever: any) {
  const toolNode = new ToolNode<typeof GraphState.State>([
    await createRetrieverTool(retriever, {
      name: "retrieve_blog_posts",
      description: "Retrieve relevant blog posts.",
    }),
  ]);

  const workflow = new StateGraph(GraphState)
    .addNode("agent", async (state) => {
      const model = new ChatOpenAI({ model: "gpt-4", temperature: 0 });
      const response = await model.invoke(state.messages);
      return { messages: [response] };
    })
    .addNode("retrieve", toolNode)
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("rewrite", rewrite)
    .addNode("generate", generate)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldRetrieve)
    .addEdge("retrieve", "gradeDocuments")
    .addConditionalEdges("gradeDocuments", checkRelevance, {
      yes: "generate",
      no: "rewrite",
    })
    .addEdge("generate", END)
    .addEdge("rewrite", "agent");

  return workflow.compile();
}

// Run the workflow
async function main() {
  const docsList = await loadDocuments();
  const retriever = await setupRetriever(docsList);
  const app = await setupGraph(retriever);

  // Define the structure of the input messages
  const inputs = {
    messages: [
      new HumanMessage(
        "What are the types of agent memory based on Lilian Weng's blog post?"
      ),
    ],
  };

  let finalState: OutputEntry | null = null;

  // Iterate through streamed outputs
  for await (const output of await app.stream(inputs)) {
    for (const [key, value] of Object.entries(output) as [
      string,
      OutputEntry
    ][]) {
      const lastMsg = value.messages[value.messages.length - 1]; // Get the last message
      console.log(`Output from node: '${key}'`);
      console.dir(
        {
          type: lastMsg._getType(),
          content: lastMsg.content,
          tool_calls: lastMsg.tool_calls,
        },
        { depth: null }
      );
      finalState = value; // Save the final state
    }
  }

  // Log the final state in a pretty JSON format
  if (finalState) {
    console.log(JSON.stringify(finalState, null, 2));
  } else {
    console.log("No final state received.");
  }
}

main().catch(console.error);
