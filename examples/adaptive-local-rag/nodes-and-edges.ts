import { Document } from "@langchain/core/documents";
import { GraphState } from "./graph-state";
import { retriever } from "./retriever";
import { formatDocs, ragChain } from "./chain-retrieved-docs";
import { retrievalGrader } from "./retrieval-grader";
import { rewriter } from "./input-question-rewriter";
import { webSearchTool } from "./web-search-tool";
import { questionRouter } from "./question-router";
import { hallucinationGrader } from "./chain-halucination-grader";
import { answerGrader } from "./chain-check-relevancy";

/* ---Nodes--- */

// Retrieve documents for a question
export const retrieve = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  console.log("---RETRIEVE---");
  const documents = await retriever.invoke(state.question);
  // Add sources to the state
  return { documents };
};

// RAG generation
export const generate = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  console.log("---GENERATE---");
  const generation = await ragChain.invoke({
    context: formatDocs(state.documents),
    question: state.question,
  });
  // Add generation to the state
  return { generation };
};

// Determines whether the retrieved documents are relevant to the question.
export const gradeDocuments = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  console.log("---CHECK DOCUMENT RELEVANCE TO QUESTION---");
  // Score each doc
  const relevantDocs: Document[] = [];
  for (const doc of state.documents) {
    const grade: { score: string } = await retrievalGrader.invoke({
      question: state.question,
      content: doc.pageContent,
    });
    if (grade.score === "yes") {
      console.log("---GRADE: DOCUMENT RELEVANT---");
      relevantDocs.push(doc);
    } else {
      console.log("---GRADE: DOCUMENT NOT RELEVANT---");
    }
  }
  return { documents: relevantDocs };
};

// Re-write question
export const transformQuery = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  console.log("---TRANSFORM QUERY---");
  const betterQuestion = await rewriter.invoke({ question: state.question });
  return { question: betterQuestion };
};

// Web search based on the re-phrased question
export const webSearch = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  console.log("---WEB SEARCH---");
  const stringifiedSearchResults = await webSearchTool.invoke(state.question);
  return {
    documents: [new Document({ pageContent: stringifiedSearchResults })],
  };
};

/* ---Edges--- */

// Decide on the datasource to route the initial question to.
export const routeQuestion = async (state: typeof GraphState.State) => {
  const source: { datasource: string } = await questionRouter.invoke({
    question: state.question,
  });
  if (source.datasource === "web_search") {
    console.log(`---ROUTING QUESTION "${state.question} TO WEB SEARCH---`);
    return "web_search";
  } else {
    console.log(`---ROUTING QUESTION "${state.question} TO RAG---`);
    return "retrieve";
  }
};

// Decide whether the current documents are sufficiently relevant
// to come up with a good answer.
export const decideToGenerate = async (state: typeof GraphState.State) => {
  const filteredDocuments = state.documents;
  // All documents have been filtered as irrelevant
  // Regenerate a new query and try again
  if (filteredDocuments.length === 0) {
    console.log(
      "---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, TRANSFORM QUERY---"
    );
    return "transform_query";
  } else {
    // We have relevant documents, so generate answer.
    console.log("---DECISION: GENERATE---");
    return "generate";
  }
};

// Determines whether the generation is grounded in the document and answers question.
export const gradeGenerationDocumentsAndQuestion = async (
  state: typeof GraphState.State
) => {
  const hallucinationGrade: { score: string } =
    await hallucinationGrader.invoke({
      generation: state.generation,
      context: formatDocs(state.documents),
    });
  // Check for hallucination
  if (hallucinationGrade.score === "yes") {
    console.log("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---");
    // Check question answering
    console.log("---GRADING GENERATION vs. QUESTION---");
    const onTopicGrade: { score: string } = await answerGrader.invoke({
      question: state.question,
      generation: state.generation,
    });
    if (onTopicGrade.score === "yes") {
      console.log("---DECISION: GENERATION ADDRESSES QUESTION---");
      return "useful";
    } else {
      console.log("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---");
      return "not_useful";
    }
  } else {
    console.log(
      "---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, RETRY---"
    );
    return "not_supported";
  }
};
