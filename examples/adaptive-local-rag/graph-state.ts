import type { Document } from "@langchain/core/documents";
import { Annotation } from "@langchain/langgraph";

// This defines the agent state.
// Returned documents from a node will override the current
// "documents" value in the state object.
export const GraphState = Annotation.Root({
  question: Annotation<string>,
  generation: Annotation<string>,
  documents: Annotation<Document[]>({
    reducer: (_, y) => y,
    default: () => [],
  }),
});
