// The pdfjs worker entry ships runtime ESM without type declarations.
// It is imported only for its WorkerMessageHandler side effect.
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  export const WorkerMessageHandler: unknown;
}
