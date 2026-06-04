import { useInventoryStore } from './inventoryStore';

export class SaveSystem {
  private static readonly STORAGE_KEY = 'mcraft_sandbox_save_v1';

  public static saveGame(): void {
    try {
      const state = useInventoryStore.getState();
      const payload = {
        inventory: state.inventory,
        backpackLevel: state.backpackLevel,
        stats: state.stats,
        quests: state.quests,
        creativeMode: state.creativeMode,
        playerName: state.playerName,
        seed: state.seed,
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      console.log('💾 Game auto-saved successfully.');
    } catch (e) {
      console.error('Failed to auto-save game:', e);
    }
  }

  public static loadGame(): boolean {
    try {
      const str = localStorage.getItem(this.STORAGE_KEY);
      if (!str) return false;

      const payload = JSON.parse(str);
      if (payload) {
        useInventoryStore.getState().loadSavedState(payload);
        console.log('💾 Game state loaded successfully.');
        return true;
      }
    } catch (e) {
      console.error('Failed to load saved game state:', e);
    }
    return false;
  }

  public static resetGame(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.reload();
  }
}
