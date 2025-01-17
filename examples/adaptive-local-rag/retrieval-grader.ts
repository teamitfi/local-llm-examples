import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { retriever } from "./retriever";

export const jsonModeLlm = new ChatOllama({
  model: "llama3",
  format: "json",
  temperature: 0,
});

const GRADER_TEMPLATE = `You are a grader assessing relevance of a retrieved document to a user question.
Here is the retrieved document:

<document>
{content}
</document>

Here is the user question:
<question>
{question}
</question>

If the document contains keywords related to the user question, grade it as relevant.
It does not need to be a stringent test. The goal is to filter out erroneous retrievals.
Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.
Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.`;

const graderPrompt = ChatPromptTemplate.fromTemplate(GRADER_TEMPLATE);

export const retrievalGrader = graderPrompt
  .pipe(jsonModeLlm)
  .pipe(new JsonOutputParser());

// Test run
// const testQuestion = "agent memory";

// const docs2 = await retriever.invoke(testQuestion);

// await retrievalGrader.invoke({
//   question: testQuestion,
//   content: docs2[0].pageContent,
// });
