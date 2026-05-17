/**
 * Product Sort Options
 * Shared sorting options for product list and search components
 * labelKey contains the i18n translation key
 */
export const PRODUCT_SORT_OPTIONS = [
  { labelKey: 'PRODUCTS.SORT.NEWEST_FIRST', value: '-createdAt' },
  { labelKey: 'PRODUCTS.SORT.OLDEST_FIRST', value: 'createdAt' },
  { labelKey: 'PRODUCTS.SORT.PRICE_LOW_HIGH', value: 'price' },
  { labelKey: 'PRODUCTS.SORT.PRICE_HIGH_LOW', value: '-price' },
  { labelKey: 'PRODUCTS.SORT.HIGHEST_RATED', value: '-ratingsAverage' },
  { labelKey: 'PRODUCTS.SORT.MOST_POPULAR', value: '-sold' }
] as const;

/**
 * Search-specific sort options (includes relevance)
 */
export const SEARCH_SORT_OPTIONS = [
  { labelKey: 'PRODUCTS.SORT.BEST_MATCH', value: 'relevance' },
  ...PRODUCT_SORT_OPTIONS
] as const;
