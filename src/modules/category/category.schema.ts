import z from 'zod';
import Category from './category.model.js';

async function isNameUsed(name: string, id?: string) {
  const category = await Category.exists({ name: name });
  if (category) {
    if (id && category._id.equals(id)) return 2;
    return true;
  }
  return false;
}

async function isExistsCategory(id: string) {
  const isExists = await Category.exists({ _id: id });
  return !!isExists;
}

const id = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, {
    error: 'Invalid category id',
  })
  .refine(isExistsCategory, { error: 'No category exists with this id' });

export const createCategorySchema = z.object({
  body: z
    .object({
      name: z.string().nonempty('please fill this field').min(2, 'too short category name').max(30, 'too long category name'),
    })
    .superRefine(async (body, ctx) => {
      if (await isNameUsed(body.name)) ctx.addIssue({ code: 'custom', message: 'Category already created before.' });
    }),
});

export const getCategoryByIdSchema = z.object({
  params: z.object({
    id,
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id,
  }),
});

export const updateCategorySchema = z
  .object({
    body: z.object({
      name: z.string().nonempty('please fill this field').min(2, 'too short category name').max(30, 'too long category name'),
    }),
    params: z.object({ id }),
  })
  .superRefine(async (data, ctx) => {
    const exists = await isNameUsed(data.body.name, data.params.id);
    if (exists === true) ctx.addIssue({ code: 'custom', message: `Can't rename this category to ${data.body.name}, it's already exists` });
  });

export type GetCategoryByIdInput = z.infer<typeof getCategoryByIdSchema>;
export type deleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type updateCategoryInput = z.infer<typeof updateCategorySchema>;
