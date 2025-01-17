import * as hub from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { retriever } from "./retriever";
import { formatDocs, llm, ragChain } from "./chain-retrieved-docs";

const HALLUCINATION_GRADER_TEMPLATE = `You are a grader assessing whether an answer is grounded in / supported by a set of facts.
Here are the facts used as context to generate the answer:

<context>
{context} 
</context>

Here is the answer:

<answer>
{generation}
</answer>

Give a binary score 'yes' or 'no' score to indicate whether the answer is grounded in / supported by a set of facts.
Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.`;

const hallucinationGraderPrompt = ChatPromptTemplate.fromTemplate(
  HALLUCINATION_GRADER_TEMPLATE
);

export const hallucinationGrader = hallucinationGraderPrompt
  .pipe(llm)
  .pipe(new JsonOutputParser());

// Test run
// export const testQuestion2 = "agent memory";
// export const docs3 = await retriever.invoke(testQuestion2);

// await ragChain.invoke({ context: formatDocs(docs3), question: testQuestion2 });

// // Test run
// export const generation2 = await ragChain.invoke({
//   context: formatDocs(docs3),
//   question: testQuestion2,
// });

// await hallucinationGrader.invoke({
//   context: formatDocs(docs3),
//   generation: generation2,
// });
