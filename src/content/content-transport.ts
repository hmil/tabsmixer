
interface BaseMessage<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

export type ContentMessageIn = 
        BaseMessage<'setVolume', { volume: number }> |
        BaseMessage<'setMuted', { muted: boolean }>;
export type ContentMessageOut = BaseMessage<'vuData', { value: number }>;
