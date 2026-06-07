import bundlesJson from '@/mocks/bundles.json';
import type { Bundle } from '@/types/bundle';

const MIN_DELAY_MS = 600;
const MAX_DELAY_MS = 1200;

export async function getBundles(): Promise<Bundle[]> {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return bundlesJson as Bundle[];
}
