export interface Embedder {
  generateEmbeddings: (texts: string[]) => Promise<number[][]>;
}
