import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
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

const loader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);
const docs = await loader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 0,
});
const allSplits = await textSplitter.splitDocuments(docs);
console.log("allSplits", allSplits.length);

const embeddings = new OllamaEmbeddings();
const vectorStore = await MemoryVectorStore.fromDocuments(
  allSplits,
  embeddings
);

const ollamaLlm = new ChatOllama({
  baseUrl: "http://localhost:11434", // Default value
  model: "llama2", // Default value
});

async function createcChain() {
  const prompt = PromptTemplate.fromTemplate(
    "Summarize the main themes in these retrieved docs: {context}"
  );

  const chain = await createStuffDocumentsChain({
    llm: ollamaLlm,
    outputParser: new StringOutputParser(),
    prompt,
  });
  return chain;
}

async function askQARetreival() {
  const question = "What are the approaches to Task Decomposition?";
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
    new StringOutputParser(),
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
  const question = "What are the approaches to Task Decomposition?";
  const docs = await vectorStore.similaritySearch(question);
  const chain = await createcChain();
  const response = await chain.invoke({
    context: docs,
  });
  console.log("askChain", response);
}

async function ask(
  question = "What are the approaches to Task Decomposition?"
) {
  const docs = await vectorStore.similaritySearch(question);
  console.log(docs.length);
}

//ask();
//askChain();
//askQA("What are the approaches to Task Decomposition in german? ");
askQARetreival();
