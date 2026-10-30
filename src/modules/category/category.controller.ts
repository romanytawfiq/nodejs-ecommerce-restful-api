import { Request, Response } from 'express';
import Category from './category.model.js';
import { responses } from '#src/utils/response.js';
import { ApiFeatures, type ApiQuery } from '#src/utils/api-features.js';
import slugify from 'slugify';
import lodash from 'lodash';

export const categoryController = {
  /**
   * Get all categories
   * @Route   `(/api/v1/categories)` GET
   * @ACL Any
   * @response [Categories] - JSEND - 200
   */
  getAllCategories: async (req: Request, res: Response) => {
    const { data, pagination } = await new ApiFeatures(Category, req.query as unknown as ApiQuery)
      .searchable(['name', 'slug'])
      .sortable(['name', 'slug', 'createdAt', 'updatedAt'])
      .selectable(['name', 'slug', 'image', 'createdAt', 'updatedAt'])
      .exec();

    return responses.success({ results: data.length, pagination, categories: data }, res);
  },

  /**
   * Get a specific category by id
   * @Route   `(/api/v1/categories/:id)` GET
   * @Params  {id: ObjectId}
   * @ACL Any
   * @response Category - JSEND - 200
   */
  getCategoryById: async (req: Request, res: Response) => {
    const categories = await Category.findById(req.params.id);
    return responses.success(categories, res);
  },

  /**
   * Get a specific category by id
   * @Route   `(/api/v1/categories/:id)` GET
   * @Params  {id: ObjectId}
   * @ACL Any
   * @response Category - JSEND - 200
   */
  updateCategoryById: async (req: Request, res: Response) => {
    const categoryData = lodash.pick(req.body, ['name']);
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, categoryData, { returnDocument: 'after' });
    return responses.success(updatedCategory, res);
  },

  /**
   * Delete a specific category by id
   * @Route   `(/api/v1/categories/:id)` DELETE
   * @Params  {id: ObjectId}
   * @ACL Any
   * @response Category - JSEND - 204
   */
  deleteCategoryById: async (req: Request, res: Response) => {
    await Category.findByIdAndDelete(req.params.id);
    return responses.success(null, res, 204);
  },

  /**
   * Create a new category
   * @Route   `(/api/v1/categories)` POST
   * @Body  {name: string, image?: File[image/*]}
   * @ACL Any
   * @response Category - JSEND - 201
   */
  createCategory: async (req: Request, res: Response) => {
    const categoryData = lodash.pick(req.body, ['name']);
    const slug = slugify(categoryData.name, { lower: true, strict: true });

    const categories = await Category.create({ ...categoryData, slug });
    return responses.success(categories, res);
  },
};
