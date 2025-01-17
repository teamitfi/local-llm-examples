import { LlamaCppEmbeddings } from "@langchain/community/embeddings/llama_cpp";
import { fileURLToPath } from "url";
import path from "path";
import { getLlama, resolveModelFile, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "models");

async function main() {
  try {
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

    console.log("Generating document embeddings...");
    const documentEmbeddings = await embeddings.embedDocuments(documents);
    console.log("Document embeddings:", documentEmbeddings);

    console.log("Generating query embedding...");
    const queryEmbedding = await embeddings.embedQuery("Hello Llama!");
    console.log("Query embedding:", queryEmbedding);

    // Cleanup resources
    context.dispose?.();
    model.dispose?.();
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

// Execute the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
