import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 });

async function main() {
  try {
    // Create a collection
    await client.createCollection("test_collection", {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });

    // Example vector to insert
    const points = [
      {
        id: 1,
        vector: Array(384).fill(0.1), // Example vector of size 384
        payload: {
          text: "Example text",
          category: "example",
        },
      },
    ];

    // Insert points into the collection
    await client.upsert("test_collection", {
      points: points,
    });

    // Search for similar vectors
    const searchResult = await client.search("test_collection", {
      vector: Array(384).fill(0.1),
      limit: 5,
    });

    console.log("Search results:", searchResult);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
