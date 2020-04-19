import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const foundTransaction = await transactionsRepository.findOne(id);

    if (!foundTransaction) {
      throw new AppError('Transaction not found');
    }

    await transactionsRepository.delete(foundTransaction.id);
  }
}

export default DeleteTransactionService;
