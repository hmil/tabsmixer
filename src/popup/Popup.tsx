import * as React from 'react';

import { Faders } from './Faders';
import { BackgroundInterface } from 'background/background-interface';
import { PopupContext } from './PopupContext';
import { TabEntry } from 'background/state/app-state';
import { ContentMessageOut } from 'content/content-transport';


const background = new BackgroundInterface();
const POPUP_STYLE: React.CSSProperties = {
    padding: '5px',
    minWidth: '300px'
};

interface SetTabsAction {
    type: 'setTabs';
    tabs: TabEntry[];
}

interface SetTabLevelAction {
    type: 'setTabLevel';
    level: number;
    tabId: number;
}

export function Popup() {

    const [tabs, dispatchTabs] = React.useReducer<React.Reducer<TabEntry[], SetTabsAction | SetTabLevelAction>>((state, action) => {
        switch (action.type) {
            case 'setTabLevel':
                return state.map(t => {
                    if (t.tabId === action.tabId) {
                        return {
                            ...t,
                            level: action.level
                        };
                    }
                    return t;
                });
            case 'setTabs':
                return action.tabs;
        }
    }, []);
    const [currentTabId, setCurrentTabId] = React.useState<number | null>(null);

    function onContentMessage(message: ContentMessageOut, sender: chrome.runtime.MessageSender) {
        if (message.type === 'vuData') {
            if (sender.tab?.id != null) {
                console.log(message.data.value);
                dispatchTabs({
                    type: 'setTabLevel',
                    level: message.data.value / 128,
                    tabId: sender.tab.id 
                });
            }
        }
    }



    React.useEffect(() => {
        background.refresh();
        chrome.tabs.query({ active: true, currentWindow: true }, result => {
            if (result.length > 0 && result[0].id != null) {
                setCurrentTabId(result[0].id);
            }
        });
        chrome.runtime.onMessage.addListener(onContentMessage);
        const onStateChange = background.onStateChange(change => {
            dispatchTabs({type: 'setTabs', tabs: change.tabs });
        });

        return () => {
            console.log('Unsubscribed');
            onStateChange.unsubscribe();
            chrome.runtime.onMessage.removeListener(onContentMessage);
        };
    }, []);

    const context = React.useMemo<PopupContext>(() => ({
        background,
        currentTabId
    }), [background, currentTabId])

    return <div style={POPUP_STYLE}>
            <PopupContext.Provider value={context}>
                <Faders tabs={tabs}/>
            </PopupContext.Provider>
        </div>
}
