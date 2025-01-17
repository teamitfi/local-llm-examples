import { formatDocumentsAsString } from "langchain/util/document";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOllama } from "@langchain/ollama";

import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { splitDocs as docs } from "../utils/directory-loader";

const embeddings = new OllamaEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

const ollamaLlm = new ChatOllama({
  baseUrl: "http://localhost:11434", // Default value
  model: "llama3", // Default value
});

async function createcChain() {
  const prompt = PromptTemplate.fromTemplate(
    "CV Details, like name, presentation,project experience, skills: {context}"
  );

  const chain = await createStuffDocumentsChain({
    llm: ollamaLlm,
    outputParser: new StringOutputParser(),
    prompt,
  });
  return chain;
}

async function askQARetreival(
  question = "Are there any develpers in the CV´s having experience in Java and Typescript?"
) {
  const retriever = vectorStore.asRetriever();
  const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  const qaChain = RunnableSequence.from([
    {
      context: (input: { question: string }, callbacks) => {
        const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
        return retrieverAndFormatter.invoke(input.question, callbacks);
      },
      question: new RunnablePassthrough(),
    },
    ragPrompt,
    ollamaLlm,
    // new StringOutputParser(),
  ]);

  const response = await qaChain.invoke({ question });
  console.log("askQARetreival", response);
}

async function askQA(question: string) {
  const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  const chain = await createStuffDocumentsChain({
    llm: ollamaLlm,
    outputParser: new StringOutputParser(),
    prompt: ragPrompt,
  });

  console.log(
    "askQA: promptMessages",
    ragPrompt.promptMessages.map((msg: any) => msg.prompt.template).join("\n")
  );
  const response = await chain.invoke({ context: docs, question });
  console.log("askQA", response);
}

async function askChain() {
  // const question =
  //   "Is there any pdf file containing the name Tim Susa? Summarize the content. Does he has experience in Java and Typescript?";
  const question = "List all CV´s with names, skill and experience.";
  const docs = await vectorStore.similaritySearch(question);
  const chain = await createcChain();
  const response = await chain.invoke({
    context: docs,
  });
  console.log("askChain", response);
}

async function ask(
  question = "Is there any pdf file containing the name Tim Susa? Summarize the content. Does he has experience in Java and Typescript?"
) {
  const docs = await vectorStore.similaritySearch(question);
  console.log(docs);
}

//ask();
//askChain();
// askQA(
//   "Are there any developers having skills in Java and Typescript? List their names and summarize their experience."
// );
askQARetreival("List all CV´s with names, skill and experience.");
