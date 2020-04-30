import { TabEntry } from './app-state';


export class AppStorage {

    private tabs: Map<number, TabEntry> = new Map();

    public addTab(tab: TabEntry) {
        if (this.tabs.has(tab.tabId)) {
            console.error('Tab is already added');
            return;
        }
        this.tabs.set(tab.tabId, tab);
    }

    public setTabVolume(tabId: number, volume: number) {
        const t = this.tabs.get(tabId);
        if (t == null) {
            console.error('Tab does not exist');
            return;
        }
        t.volume = volume;
    }

    public setTabMuted(tabId: number, muted: boolean) {
        const t = this.tabs.get(tabId);
        if (t == null) {
            console.error('Tab does not exist');
            return;
        }
        t.muted = muted;
    }

    /**
     * returns true if a tab was removed
     */
    public removeTab(tabId: number): boolean {
        if (this.tabs.has(tabId)) {
            this.tabs.delete(tabId);
            return true;
        }
        return false;
    }

    public getAllTabs(): Array<TabEntry> {
        return Array.from(this.tabs.values());
    }
}
