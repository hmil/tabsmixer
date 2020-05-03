import * as React from 'react';
import { BackgroundInterface } from 'background/interface/background-interface';

export interface PopupContext {
    background: BackgroundInterface;
    currentTabId: number | null;
}

export const PopupContext = React.createContext<PopupContext>({
    background: new BackgroundInterface(),
    currentTabId: null
});
