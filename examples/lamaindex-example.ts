import {
  ChromaVectorStore,
  CSVReader,
  storageContextFromDefaults,
  VectorStoreIndex,
  serviceContextFromDefaults,
  PDFReader,
  SimpleDirectoryReader,
  Metadata,
  Document,
  VectorStoreQuery,
  VectorStoreQueryMode,
} from "llamaindex";
import { ChromaClient } from "chromadb";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "dotenv";
import { readAllFiles } from "../utils/read-all-files-from-folders";
// Load environment variables
config();

const execAsync = promisify(exec);
const collectionName = "llama-index-collection";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";

async function isDockerRunning(): Promise<boolean> {
  try {
    await execAsync("docker ps");
    return true;
  } catch (error) {
    return false;
  }
}

async function isChromaRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      'docker ps --filter "name=chromadb" --format "{{.Names}}"'
    );
    return stdout.includes("chromadb");
  } catch (error) {
    return false;
  }
}

async function setupChromaCollection(): Promise<void> {
  const client = new ChromaClient({
    path: "http://localhost:8000",
  });

  // Wait for ChromaDB to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      console.log("Attempting to connect to ChromaDB...");
      if (process.env.ALLOW_RESET === "true") {
        await client.reset();
        console.log("Reset database successfully");
      }
      await client.listCollections();
      console.log("Successfully connected to ChromaDB!");
      break;
    } catch (error) {
      console.log(
        `Waiting for ChromaDB to be ready... (${retries} retries left)`
      );
      console.error("Connection error:", error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      retries--;
      if (retries === 0) {
        console.error("All retries exhausted. Could not connect to ChromaDB.");
        throw new Error(
          "Failed to connect to ChromaDB after multiple attempts"
        );
      }
    }
  }

  // Create or get collection
  try {
    console.log("Listing collections...");
    const collections = await client.listCollections();
    console.log("Current collections:", collections);

    const exists = collections.some((col) => col.name === collectionName);
    if (!exists) {
      console.log(`Creating collection: ${collectionName}`);
      await client.createCollection({ name: collectionName });
      console.log("Collection created successfully!");
    } else {
      console.log(`Collection ${collectionName} already exists`);
    }
  } catch (error) {
    console.error("Error setting up ChromaDB collection:", error);
    throw error;
  }
}

async function setupChroma(): Promise<void> {
  const dockerRunning = await isDockerRunning();
  if (!dockerRunning) {
    throw new Error("Docker is not running. Please start Docker first.");
  }

  const chromaRunning = await isChromaRunning();
  if (!chromaRunning) {
    console.log("Starting ChromaDB...");
    await execAsync(
      `docker run -d --name chromadb -p 8000:8000 \
      -e ALLOW_RESET=${process.env.ALLOW_RESET || "true"} \
      -e ANONYMIZED_TELEMETRY=${process.env.ANONYMIZED_TELEMETRY || "false"} \
      -v /Users/timsusawork/dev/exported:/chroma/chroma \
      chromadb/chroma:latest`
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  await setupChromaCollection();
}

async function main() {
  try {
    const { queryEngine, ctx } = await create();
    const res = await queryEngine.query({
      query:
        "List all developers having skills Typescript so create on overview list with all their names and time of experience",
    });
    console.log(res.toString());

    // console.log("Creating ChromaDB vector store");
    // const ctx = await storageContextFromDefaults({ vectorStore: chromaVS });

    // console.log("Embedding documents and adding to index");
    // await VectorStoreIndex.fromDocuments(docs, {
    //   storageContext: ctx,
    // });
  } catch (e) {
    console.error(e);
  }
}

void main();

async function create() {
  const sourceFile: string = "./output/resumes-pdf";

  await setupChroma();
  console.log(`Loading data from ${sourceFile}`);
  let docs: Document<Metadata>[] = [];
  for (const file of readAllFiles(sourceFile)) {
    console.log(file);
    if (file.endsWith(".pdf")) {
      const reader = new PDFReader();
      const tmp = await reader.loadData(file);
      docs = [...docs, ...tmp];
    } else if (file.endsWith(".csv")) {
      const reader = new CSVReader();
      const tmp = await reader.loadData(file);
    }
  }

  // Create service context using the new method

  console.log("Creating ChromaDB vector store");
  const chromaVS = new ChromaVectorStore({ collectionName });

  const ctx = await storageContextFromDefaults({ vectorStore: chromaVS });

  console.log("Embedding documents and adding to index");
  const index = await VectorStoreIndex.fromDocuments(docs);
  console.log("Querying index");
  const queryEngine = index.asQueryEngine();
  return { queryEngine, index, docs, chromaVS, ctx };
}
