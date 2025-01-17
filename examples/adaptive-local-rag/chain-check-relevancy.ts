import { ChatPromptTemplate } from "@langchain/core/prompts";
import { jsonModeLlm } from "./retrieval-grader";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { formatDocs, ragChain } from "./chain-retrieved-docs";
import { docs3, testQuestion2 } from "./chain-halucination-grader";

const ANSWER_GRADER_PROMPT_TEMPLATE = `You are a grader assessing whether an answer is useful to resolve a question.
Here is the answer:

<answer>
{generation} 
</answer>

Here is the question:

<question>
{question}
</question>

Give a binary score 'yes' or 'no' to indicate whether the answer is useful to resolve a question.
Provide the binary score as a JSON with a single key 'score' and no preamble or explanation.`;

const answerGraderPrompt = ChatPromptTemplate.fromTemplate(
  ANSWER_GRADER_PROMPT_TEMPLATE
);

export const answerGrader = answerGraderPrompt
  .pipe(jsonModeLlm)
  .pipe(new JsonOutputParser());

// // Test run
// const generation3 = await ragChain.invoke({
//   context: formatDocs(docs3),
//   question: testQuestion2,
// });

// await answerGrader.invoke({ question: testQuestion2, generation: generation3 });
