import * as React from 'react';
import { Fader } from './Fader';
import { AddTabButton } from './AddTabButton';
import { TabEntry } from 'background/state/app-state';
import { PopupContext } from './PopupContext';

interface FadersProps {
    tabs: TabEntry[];
}

export function Faders({tabs}: FadersProps) {

    const { currentTabId } = React.useContext(PopupContext);
    const hasCurrentTab = tabs.find(t => t.tabId === currentTabId);

    return <div className="sliders">
        { tabs.map(tab => <Fader tab={tab} key={tab.tabId} />) }
        { currentTabId != null && !hasCurrentTab ? <AddTabButton currentTabId={currentTabId}/> : undefined }
    </div>;
}