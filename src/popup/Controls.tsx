import * as React from 'react';
import { AddTabButton } from './AddTabButton';
import { PopupContext } from './PopupContext';
import { UITab } from './domain/UITab';
import { TabControl, TAB_CONTROL_WIDTH } from './TabControl';

interface ControlsProps {
    tabs: UITab[];
}

interface DragState {
    tabId: number;
    offset: number;
}

const PLACEHOLDER = <div key="placeholder" style={{
    padding: '3px',
    width: `${TAB_CONTROL_WIDTH - 6}px`
}}>
    <div style={{
        border: '1px #222 dashed',
        height: '100%'
    }}></div>
</div>

export function Controls({tabs}: ControlsProps) {

    const { currentTabId, background } = React.useContext(PopupContext);
    const hasCurrentTab = tabs.find(t => t.tabId === currentTabId);

    const [dragState, setDragState] = React.useState<DragState | null>(null);
    const [dragPosition, setDragPosition] = React.useState<number>(0);
    const [dropIndex, setDropIndex] = React.useState<number>(0);

    function onDragStart(tabId: number, offset: number, startX: number) {
        const tabIndex = tabs.findIndex(t => t.tabId === tabId);
        if (tabIndex >= 0) {
            setDragState({
                offset,
                tabId
            });
            setDropIndex(tabIndex);
            setDragPosition(startX - offset);
        }
    }

    React.useEffect(() => {
        function onMove(evt: MouseEvent) {
            if (dragState != null) {
                setDragPosition(evt.clientX - dragState.offset);
                const index = Math.floor(evt.clientX / TAB_CONTROL_WIDTH);
                if (index >= 0 && index < tabs.length) {
                    setDropIndex(index);
                }
            }
        }

        function onUp() {
            if (dragState != null) {
                setDragState(null);
                background.moveTab(dragState.tabId, dropIndex);
            }
        }

        if (dragState != null) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        }
    }, [dragState, background, dropIndex]);

    function renderTabs() {
        const ret: JSX.Element[] = [];
        if (dragState && dropIndex === 0) {
            ret.push(PLACEHOLDER);
        }
        for (let i = 0 ; i < tabs.length ; i++) {
            const tab = tabs[i];
            if (tab.tabId !== dragState?.tabId) {
                ret.push(<TabControl tab={tab} key={tab.tabId} onDragStart={onDragStart} />);
            }
            if (dragState && ret.length === dropIndex) {
                ret.push(PLACEHOLDER);
            }
        }
        return ret;
    }

    const draggedTab = dragState && tabs.find(t => t.tabId === dragState.tabId);

    return <div className="sliders">
        { renderTabs() }
        { currentTabId != null && !hasCurrentTab ? <AddTabButton currentTabId={currentTabId}/> : undefined }
        { draggedTab != null ? 
            <div style={{position: 'absolute', left: dragPosition}}><TabControl tab={draggedTab} /></div>
            : undefined
        }
    </div>;
}