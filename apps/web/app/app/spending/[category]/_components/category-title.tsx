import { getCategoryDetails } from '@/lib/db/category';

const CategoryTitle = async ({
  params,
}: {
  params: Promise<{ category: string }>;
}) => {
  const { category: categoryId } = await params;
  const categoryDetails = categoryId
    ? await getCategoryDetails(categoryId)
    : null;

  if (!categoryDetails) return null;

  return (
    <h1 className="text-2xl/tight font-bold">
      {categoryDetails.category.category_name}
    </h1>
  );
};

export default CategoryTitle;
