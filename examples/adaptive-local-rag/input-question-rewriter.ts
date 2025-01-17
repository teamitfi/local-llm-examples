import { ChatPromptTemplate } from "@langchain/core/prompts";
import { llm } from "./chain-retrieved-docs";
import { StringOutputParser } from "@langchain/core/output_parsers";
//import { testQuestion2 } from "./chain-halucination-grader";

const REWRITER_PROMPT_TEMPLATE = `You a question re-writer that converts an input question to a better version that is optimized
for vectorstore retrieval. Look at the initial and formulate an improved question.

Here is the initial question:

<question>
{question}
</question>

Respond only with an improved question. Do not include any preamble or explanation.`;

const rewriterPrompt = ChatPromptTemplate.fromTemplate(
  REWRITER_PROMPT_TEMPLATE
);

export const rewriter = rewriterPrompt.pipe(llm).pipe(new StringOutputParser());

// Test run

// Test question is "agent memory"
//await rewriter.invoke({ question: testQuestion2 });
