import { pipeline } from '@huggingface/transformers';
import chalk from 'chalk';
import { Embedder } from './types';

export class HuggingFaceEmbedder implements Embedder {
  private model: string;

  constructor(model?: string) {
    this.model = model || 'Xenova/all-MiniLM-L6-v2';
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embedder = await pipeline('feature-extraction', this.model, { dtype: 'fp32' });
    console.log(chalk.cyan(`  - Generating embeddings with Hugging Face (${this.model})...`));
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const output = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data) as any;
      })
    );
    console.log(chalk.green(`  - Embeddings generated successfully!`));
    return embeddings;
  }
}
