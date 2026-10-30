import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { validate } from '#src/middlewares/validate.js';
import { createCategorySchema, deleteCategorySchema, getCategoryByIdSchema, updateCategorySchema } from './category.schema.js';

const router = Router();

router
  .route('/v1/categories/:id')
  .get(validate(getCategoryByIdSchema), categoryController.getCategoryById)
  .put(validate(updateCategorySchema), categoryController.updateCategoryById)
  .delete(validate(deleteCategorySchema), categoryController.deleteCategoryById);

router
  .route('/v1/categories')
  .get(categoryController.getAllCategories)
  .post(validate(createCategorySchema), categoryController.createCategory);

export default router;
