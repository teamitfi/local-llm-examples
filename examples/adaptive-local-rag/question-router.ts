import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOllama } from "@langchain/ollama";
import { jsonModeLlm } from "./retrieval-grader";

const QUESTION_ROUTER_SYSTEM_TEMPLATE = `You are an expert at routing a user question to a vectorstore or web search.
Use the vectorstore for questions on LLM agents, prompt engineering, and adversarial attacks.
You do not need to be stringent with the keywords in the question related to these topics.
Otherwise, use web-search. Give a binary choice 'web_search' or 'vectorstore' based on the question.
Return the a JSON with a single key 'datasource' and no preamble or explanation.`;

const questionRouterPrompt = ChatPromptTemplate.fromMessages([
  ["system", QUESTION_ROUTER_SYSTEM_TEMPLATE],
  ["human", "{question}"],
]);

export const questionRouter = questionRouterPrompt
  .pipe(jsonModeLlm)
  .pipe(new JsonOutputParser());

//await questionRouter.invoke({ question: "llm agent memory" });
