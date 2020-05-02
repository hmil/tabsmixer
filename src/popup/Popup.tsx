import * as React from 'react';

import { BackgroundInterface } from 'background/background-interface';
import { PopupContext } from './PopupContext';
import { ContentMessageOut } from 'content/content-transport';
import { UITab } from './domain/UITab';
import { TabEntry } from 'background/state/app-state';
import { Controls } from './Controls';


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

    const [tabs, dispatchTabs] = React.useReducer<React.Reducer<UITab[], SetTabsAction | SetTabLevelAction>>((state, action) => {
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
                return action.tabs.map(t => ({
                    ...t,
                    level: state.find(tab => tab.tabId === t.tabId)?.level ?? 0
                }));
        }
    }, []);
    const [currentTabId, setCurrentTabId] = React.useState<number | null>(null);

    function onContentMessage(message: ContentMessageOut, sender: chrome.runtime.MessageSender) {
        if (message.type === 'vuData') {
            if (sender.tab?.id != null) {
                console.log(message.data.value);
                dispatchTabs({
                    type: 'setTabLevel',
                    level: message.data.value,
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
                <Controls tabs={tabs}/>
            </PopupContext.Provider>
        </div>
}
