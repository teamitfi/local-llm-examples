import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';

export enum MimeTypes {
  pdf = 'application/pdf',
  oct = 'binary/octet-stream',
  txt = 'text/plain',
  utext = 'text/plain; charset=utf-8',
  pptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv = 'text/csv',
}

export enum FileExtensions {
  pdf = '.pdf',
  txt = '.txt',
  docx = '.docx',
  pptx = '.pptx',
  csv = '.csv',
  xlsx = '.xlsx',
}

export type DocLoaders =
  | typeof DocxLoader
  | typeof PPTXLoader
  | typeof TextLoader
  | typeof WebPDFLoader
  | typeof CSVLoader;
