
export interface TabEntry {
    tabId: number;
    volume: number;
    muted: boolean;
}

export interface AppState {
    tabs: TabEntry[];
    midiInputs: string[];
    currentMidiInput: string;
}
