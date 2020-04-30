import { TabEntry, AppState } from './state/app-state';

interface BaseMessage<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

export type RefreshStateMessage = BaseMessage<'refresh', AppState>;

export type BackgroundMessageIn =
        BaseMessage<'addTab', TabEntry> |
        BaseMessage<'removeTab', number> |
        BaseMessage<'setVolume', { tabId: number, volume: number}> |
        BaseMessage<'setMuted', { tabId: number, muted: boolean }> |
        BaseMessage<'refresh', void>;
export type BackgroundMessageOut = RefreshStateMessage;
