import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';



export type SortOption = 'top_rated' | 'nearest' | 'lowest_price' | 'fastest';



export type LaundryFilters = {

  search: string;

  minRating: number;

  maxDistance: number;

  maxDeliveryHours: number;

  maxPrice: number;

  sort: SortOption;

};



export const DEFAULT_FILTERS: LaundryFilters = {

  search: '',

  minRating: 0,

  maxDistance: 10,

  maxDeliveryHours: 999,

  maxPrice: 500,

  sort: 'top_rated',

};



export type ApiSearchSort = 'relevance' | 'rating' | 'name';



/** Maps UI sort to server search sort (text relevance handled server-side). */

export function mapSortToApi(sort: SortOption): ApiSearchSort {

  if (sort === 'top_rated') return 'rating';

  return 'relevance';

}



/** Client-side filters for pseudo-fields (distance, price, delivery) and local sort. */

export function applyClientFilters(

  items: EnrichedLaundry[],

  filters: LaundryFilters,

): EnrichedLaundry[] {

  let result = items.filter((l) => {

    if (Number(l.avg_rating) < filters.minRating) return false;

    if (l.distanceKm > filters.maxDistance) return false;

    if (l.deliveryHours > filters.maxDeliveryHours) return false;

    if (l.startPrice > filters.maxPrice) return false;

    return true;

  });



  result = [...result].sort((a, b) => {

    switch (filters.sort) {

      case 'nearest':

        return a.distanceKm - b.distanceKm;

      case 'lowest_price':

        return a.startPrice - b.startPrice;

      case 'fastest':

        return a.deliveryHours - b.deliveryHours;

      case 'top_rated':

        return Number(b.avg_rating) - Number(a.avg_rating);

      default:

        return Number(b.avg_rating) - Number(a.avg_rating);

    }

  });



  return result;

}


