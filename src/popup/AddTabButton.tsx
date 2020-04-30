import * as React from 'react';
import { PopupContext } from './PopupContext';

interface AddTabProps {
    currentTabId: number
}

export function AddTabButton({currentTabId}: AddTabProps) {

    const ctx = React.useContext(PopupContext);

    const addTabToContext = React.useCallback(() => {
        ctx.background.addTab({
            tabId: currentTabId,
            volume: 1,
            level: 0,
            muted: false
        })
    }, [ctx, currentTabId]);

    return <div style={{ textAlign: 'center', flexGrow: 1 }}>
        <button onClick={addTabToContext} className="add-tab-button" >+</button><br />
        Add this tab
    </div>;
}
