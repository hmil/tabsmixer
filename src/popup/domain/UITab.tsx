import { TabEntry } from 'background/state/app-state';

export interface UITab extends TabEntry {
    level: number;
}