import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./graph-state";
import {
  decideToGenerate,
  generate,
  gradeDocuments,
  gradeGenerationDocumentsAndQuestion,
  retrieve,
  routeQuestion,
  transformQuery,
  webSearch,
} from "./nodes-and-edges";

const graph = new StateGraph(GraphState)
  .addNode("web_search", webSearch)
  .addNode("retrieve", retrieve)
  .addNode("grade_documents", gradeDocuments)
  .addNode("generate", generate)
  .addNode("transform_query", transformQuery)
  .addConditionalEdges(START, routeQuestion)
  .addEdge("web_search", "generate")
  .addEdge("retrieve", "grade_documents")
  .addConditionalEdges("grade_documents", decideToGenerate)
  .addEdge("transform_query", "retrieve")
  .addConditionalEdges("generate", gradeGenerationDocumentsAndQuestion, {
    not_supported: "generate",
    useful: END,
    not_useful: "transform_query",
  });

export const app = graph.compile({
  checkpointer: new MemorySaver(),
  interruptBefore: ["web_search"],
});

// await app.invoke(
//   {
//     question: "What are some features of long-term memory?",
//   },
//   { configurable: { thread_id: "1" } }
// );
console.log(
  await app.invoke(
    {
      question:
        "List all local pdf documents by name and give a short summary for each. Do not make a websearch.",
    },
    { configurable: { thread_id: "1" } }
  )
);
//console.log(await app.invoke(null, { configurable: { thread_id: "2" } }));
