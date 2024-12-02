import { fileURLToPath } from "url";
import path from "path";
import { getLlama, LlamaEmbedding, resolveModelFile } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDirectory = path.join(__dirname, "models");

const modelPath = await resolveModelFile(
  "hf:mradermacher/Meta-Llama-3.1-8B-Instruct-GGUF/Meta-Llama-3.1-8B-Instruct.Q4_K_M.gguf",
  modelsDirectory
);
const llama = await getLlama();
const model = await llama.loadModel({
  modelPath,
});
const context = await model.createEmbeddingContext();

async function embedDocuments(documents: readonly string[]) {
  const embeddings = new Map<string, LlamaEmbedding>();

  await Promise.all(
    documents.map(async (document) => {
      const embedding = await context.getEmbeddingFor(document);
      embeddings.set(document, embedding);

      console.debug(
        `${embeddings.size}/${documents.length} documents embedded`
      );
    })
  );

  return embeddings;
}

function findSimilarDocuments(
  embedding: LlamaEmbedding,
  documentEmbeddings: Map<string, LlamaEmbedding>
) {
  const similarities = new Map<string, number>();
  for (const [otherDocument, otherDocumentEmbedding] of documentEmbeddings)
    similarities.set(
      otherDocument,
      embedding.calculateCosineSimilarity(otherDocumentEmbedding)
    );

  return Array.from(similarities.keys()).sort(
    (a, b) => similarities.get(b)! - similarities.get(a)!
  );
}

const documentEmbeddings = await embedDocuments([
  "The sky is clear and blue today",
  "I love eating pizza with extra cheese",
  "Dogs love to play fetch with their owners",
  "The capital of France is Paris",
  "Drinking water is important for staying hydrated",
  "Mount Everest is the tallest mountain in the world",
  "A warm cup of tea is perfect for a cold winter day",
  "Painting is a form of creative expression",
  "Not all the things that shine are made of gold",
  "Cleaning the house is a good way to keep it tidy",
]);

const query = "What is the tallest mountain on Earth?";
const queryEmbedding = await context.getEmbeddingFor(query);

const similarDocuments = findSimilarDocuments(
  queryEmbedding,
  documentEmbeddings
);
const topSimilarDocument = similarDocuments[0];

console.log("query:", query);
console.log("Document:", topSimilarDocument);
