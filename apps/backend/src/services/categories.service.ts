import { CategoriesRepository } from '../repositories/categories.repository';
import { AppResult, success, failure, NotFoundError } from '../utils/result';
import { Category } from '../db/schema';

export class CategoriesService {
  private repository: CategoriesRepository;

  constructor() {
    this.repository = new CategoriesRepository();
  }

  async getAllCategories(): Promise<AppResult<Category[]>> {
    return await this.repository.findAll();
  }

  async getTopLevelCategories(): Promise<AppResult<Category[]>> {
    return await this.repository.findTopLevel();
  }

  async getCategory(id: string): Promise<AppResult<Category>> {
    const result = await this.repository.findById(id);
    if (result.isErr()) return failure(result.error);
    if (!result.value) return failure(new NotFoundError('Category', id));
    return success(result.value);
  }

  async createCategory(name: string, parentId?: string | null): Promise<AppResult<Category>> {
    return await this.repository.create(name, parentId);
  }
}
