import { LlamaCppEmbeddings } from "@langchain/community/embeddings/llama_cpp";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, resolveModelFile, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "models");

const modelPath = await resolveModelFile(
  "hf:mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
  modelsDirectory
);

const llama = await getLlama();
const model = await llama.loadModel({ modelPath });
const context = await model.createContext();
const session = new LlamaChatSession({
  contextSequence: context.getSequence(),
});

const documents = ["Hello World!", "Bye Bye!"];

const embeddings = await LlamaCppEmbeddings.initialize({
  modelPath,
});

const res = await embeddings.embedDocuments(documents);

console.log(res);

const res2 = embeddings.embedQuery("Hello Llama!");

console.log(res2);
