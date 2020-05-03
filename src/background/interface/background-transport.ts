import { TabEntry, AppState } from '../state/app-state';

interface BaseMessage<Type extends string, DATA> {
    type: Type;
    data: DATA;
}


export type BackgroundMessageIn =
        BaseMessage<'addTab', TabEntry> |
        BaseMessage<'removeTab', number> |
        BaseMessage<'moveTab', { tabId: number, newIndex: number }> |
        BaseMessage<'setVolume', { tabId: number, volume: number}> |
        BaseMessage<'setMuted', { tabId: number, muted: boolean }> |
        BaseMessage<'setMidiDevice', { device: string }> |
        BaseMessage<'refresh', void>;
export type BackgroundMessageOut = BaseMessage<'refresh', AppState>;
