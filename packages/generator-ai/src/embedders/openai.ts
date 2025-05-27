import chalk from 'chalk';
import OpenAI from 'openai';
import { Embedder } from './types';

// enum of Models
enum Model {
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
}

export class OpenAIEmbedder implements Embedder {
  private model: Model;

  constructor(model?: string) {
    this.model = (model as Model) || Model.TEXT_EMBEDDING_3_LARGE;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const openai = new OpenAI();
    console.log(chalk.cyan(`  - Generating embeddings with OpenAI (${this.model})...`));
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        return await openai.embeddings.create({
          model: this.model,
          input: text,
          encoding_format: 'float',
        });
      })
    );
    console.log(chalk.green(`  - Embeddings generated successfully!`));
    return embeddings.map((embedding) => embedding.data[0].embedding);
  }
}
