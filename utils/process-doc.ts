import { DocLoaders, FileExtensions, MimeTypes } from "./types.js";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { Document } from "langchain/document";
import * as Xlsx from "xlsx";

export async function getDocData(
  loader: DocLoaders,
  data: ArrayBuffer | Buffer | Error,
  url: string,
  type: MimeTypes
): Promise<string> {
  try {
    if (data instanceof Buffer || data instanceof ArrayBuffer) {
      const blob = new Blob([data], { type });
      const docs = await processDoc(blob, loader);

      const docsArray = docs.map(({ pageContent }: Document, idx) => {
        return {
          pageContent,
          metadata: {
            page: idx,
            url,
          },
        };
      });

      return JSON.stringify(docsArray);
    }
    return "error fetching page content";
  } catch (err) {
    console.error(err);
    return "error fetching page content";
  }
}

export async function processDoc(blob: Blob, Loader: DocLoaders) {
  const localLoader = new Loader(blob);
  const doc = await localLoader.load();
  return doc;
}

export async function getDocsByLoader({
  url,
  fileExt,
  data,
}: {
  url: string;
  fileExt: string;
  data: Buffer | ArrayBuffer | Error;
}) {
  if (fileExt === FileExtensions.txt) {
    return await getDocData(TextLoader, data, url, MimeTypes.txt);
  } else if (fileExt === FileExtensions.pdf) {
    return await getDocData(WebPDFLoader, data, url, MimeTypes.pdf);
  } else if (fileExt === FileExtensions.docx) {
    return await getDocData(DocxLoader, data, url, MimeTypes.docx);
  } else if (fileExt === FileExtensions.pptx) {
    return await getDocData(PPTXLoader, data, url, MimeTypes.pptx);
  } else if (fileExt === FileExtensions.csv) {
    return await getDocData(CSVLoader, data, url, MimeTypes.csv);
  } else if (fileExt === FileExtensions.xlsx) {
    const workbook = Xlsx.read(data, { type: "buffer" });

    let mergedCsvData = `${getFileName(url)},`;
    let isFirstSheet = true;

    // In order to merge all sheets into one CSV, we need to add the sheet name to each row
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const csvData = Xlsx.utils.sheet_to_csv(worksheet);

      // Add "Sheet Name" to each row of the current sheet
      const rows = csvData
        .split("\n")
        .map((row, index) => {
          if (index === 0 && isFirstSheet) {
            return row; // Keep the header as is
          }
          return sheetName + "," + row;
        })
        .join("\n");

      mergedCsvData += rows + "\n";
      isFirstSheet = false;
    });

    return await getDocData(
      CSVLoader,
      Buffer.from(mergedCsvData),
      url,
      MimeTypes.csv
    );
  }
  return "Nothing found";
}

export function getFileName(url: string = ""): string {
  const regex = /\/([^\\/?#]+)$/;
  const match = regex.exec(url);
  return match ? match[1] : "";
}

export function getFileExtension(url: string = ""): string {
  const regex = /\.[^/.]+$/;
  const match = regex.exec(url);
  return match ? match[0] : "";
}
