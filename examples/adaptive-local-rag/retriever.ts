import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/ollama";
import { splitDocs } from "./directory-loader";

// const urls = [
//   "https://lilianweng.github.io/posts/2023-06-23-agent/",
//   "https://lilianweng.github.io/posts/2023-03-15-prompt-engineering/",
//   "https://lilianweng.github.io/posts/2023-10-25-adv-attack-llm/",
// ];

// const docs = await Promise.all(
//   urls.map((url) => {
//     const loader = new CheerioWebBaseLoader(url);
//     return loader.load();
//   })
// );

// const docsList = docs.flat();

// const textSplitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 250,
//   chunkOverlap: 0,
// });

// const splitDocs = await textSplitter.splitDocuments(docsList);

const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
});

// Add to vector store
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  embeddings
);

export const retriever = vectorStore.asRetriever();
