import { TabEntry } from './app-state';
import { arrayReplace, arrayRemove, arrayInsert } from 'utils/readonly-arrays';

const STORAGE_KEY = 'TABSMIXER-2';

export class AppStorage {

    constructor(private readonly storage: Storage) { }

    private getTabs(): ReadonlyArray<Readonly<TabEntry>> {
        const serialized = this.storage.getItem(STORAGE_KEY);
        if (serialized == null) {
            return [];
        }
        try {
            const des = JSON.parse(serialized);
            return des;
        } catch (e) {
            console.error('Failed to deserialize storage');
            return [];
        }
    }
    
    private setTabs(data: ReadonlyArray<Readonly<TabEntry>>) {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    public addTab(tab: TabEntry) {
        const tabs = this.getTabs();
        if (tabs.findIndex(t => t.tabId === tab.tabId) >= 0) {
            console.error('Tab is already added');
            return;
        }
        this.setTabs([...tabs, tab]);
    }

    public setTabVolume(tabId: number, volume: number) {
        const tabs = this.getTabs();
        const t = tabs.findIndex(t => t.tabId === tabId);
        if (t < 0) {
            console.error('Tab does not exist');
            return;
        }
        this.setTabs(arrayReplace(tabs, t, { ...tabs[t], volume }));
    }

    public setTabMuted(tabId: number, muted: boolean) {
        const tabs = this.getTabs();
        const t = tabs.findIndex(t => t.tabId === tabId);
        if (t == null) {
            console.error('Tab does not exist');
            return;
        }
        this.setTabs(arrayReplace(tabs, t, { ...tabs[t], muted }));
    }

    /**
     * returns true if a tab was removed
     */
    public removeTab(tabId: number): boolean {
        const tabs = this.getTabs();
        const t = tabs.findIndex(t => t.tabId === tabId);
        if (t >= 0) {
            this.setTabs(arrayRemove(tabs, t));
            return true;
        }
        return false;
    }

    public moveTab(tabId: number, newIndex: number): void {
        const tabs = this.getTabs();
        const t = tabs.findIndex(t => t.tabId === tabId);
        if (t < 0) {
            console.error('Tab not found');
            return;
        }
        const tab = tabs[t];
        this.setTabs(arrayInsert(arrayRemove(tabs, t), newIndex, tab));
    }

    public getAllTabs(): Array<TabEntry> {
        return Array.from(this.getTabs().values());
    }
}
