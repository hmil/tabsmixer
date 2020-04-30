
export interface TabEntry {
    tabId: number;
    volume: number;
    level: number;
    muted: boolean;
}

export interface AppState {
    tabs: TabEntry[];
}
