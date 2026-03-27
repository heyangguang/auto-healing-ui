import { usePlaybookDetailState } from './usePlaybookDetailState';
import { usePlaybookInventoryState } from './usePlaybookInventoryState';

export function usePlaybookListModel() {
    const inventory = usePlaybookInventoryState();
    const detail = usePlaybookDetailState({
        loadPlaybooks: inventory.loadPlaybooks,
        mergePlaybookInInventory: inventory.mergePlaybookInInventory,
        removePlaybookFromInventory: inventory.removePlaybookFromInventory,
    });

    return {
        ...inventory,
        ...detail,
    };
}
