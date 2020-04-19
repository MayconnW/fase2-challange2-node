import path from 'path';
import fs from 'fs';
import parse from 'csv-parse';

import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

import CreateTransactionService from './CreateTransactionService';

interface TransactionToProcess {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const filePath = path.join(uploadConfig.directory, filename);
    const file = await fs.promises.stat(filePath);

    if (!file) {
      throw new AppError('File does not exist');
    }

    const csvArray = (): Promise<TransactionToProcess[]> =>
      new Promise(resolve => {
        const list: TransactionToProcess[] = [];
        fs.createReadStream(filePath)
          .pipe(
            parse({ delimiter: ',', columns: true, ltrim: true, cast: true }),
          )
          .on('data', async data => {
            const { title, value, type, category } = data;
            list.push({ title, value, type, category });
          })
          .on('end', () => {
            resolve(list);
          });
      });

    const transactions = await csvArray();
    const incomesToProcess = transactions
      .filter(item => item.type === 'income')
      .map(async item => {
        const createTransaction = new CreateTransactionService();
        const t = await createTransaction.execute({
          title: item.title,
          value: item.value,
          type: item.type,
          category: item.category,
        });
        return t;
      });

    const incomes = await Promise.all(incomesToProcess);

    const outcomesToProcess = transactions
      .filter(item => item.type === 'outcome')
      .map(async item => {
        const createTransaction = new CreateTransactionService();
        const t = await createTransaction.execute({
          title: item.title,
          value: item.value,
          type: item.type,
          category: item.category,
        });
        return t;
      });

    const outcomes = await Promise.all(outcomesToProcess);
    return [...incomes, ...outcomes];
  }
}

export default ImportTransactionsService;
