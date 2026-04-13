import {
    invalidateSelectorInventory,
    selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';

export function invalidatePlaybookInventoryCache() {
    invalidateSelectorInventory(selectorInventoryKeys.playbooks);
}
