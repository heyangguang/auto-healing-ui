export interface ProductMenuCategory {
  id: string;
}

export function resolveActiveCategoryId(
  categories: ProductMenuCategory[],
  currentCategoryId: string,
) {
  if (categories.some((category) => category.id === currentCategoryId)) {
    return currentCategoryId;
  }

  const firstNonGuideCategory = categories.find((category) => category.id !== 'guide');
  return firstNonGuideCategory?.id || categories[0]?.id || '';
}
