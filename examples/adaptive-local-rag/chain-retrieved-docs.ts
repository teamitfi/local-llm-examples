import * as hub from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";
import { ChatOllama } from "@langchain/ollama";
import { retriever } from "./retriever";

// https://smith.langchain.com/hub/rlm/rag-prompt
const ragPrompt = await hub.pull("rlm/rag-prompt");

// Post-processing
export const formatDocs = (docs: Document[]) => {
  return docs.map((doc) => doc.pageContent).join("\n\n");
};

// Initialize a new model without JSON mode active
export const llm = new ChatOllama({
  model: "llama3",
  temperature: 0,
});

// Chain
export const ragChain = ragPrompt.pipe(llm).pipe(new StringOutputParser());
