import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../utils/http.js';
export const publicNewsKey = ['public-news'];
const EMPTY = [];
export default function usePublicNews() {
  const query = useQuery({ queryKey: publicNewsKey, queryFn: async ({ signal }) => {
    const data = await fetchJson('/api/news', { signal, cache: 'no-store' });
    if (!Array.isArray(data)) throw new Error('Dữ liệu tin tức không hợp lệ.');
    return data;
  }, staleTime: 0, refetchOnWindowFocus: 'always', refetchOnMount: 'always', refetchInterval: 15000 });
  return { ...query, articles: query.isError ? EMPTY : query.data || EMPTY };
}
