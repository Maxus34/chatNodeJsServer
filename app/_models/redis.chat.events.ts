import {Dialog, DialogReference } from "./chat.models";

export interface RedisMessageEventData{
    dialogId :number;
    from     :number;
    item     :Dialog;
}

export interface RedisDialogEventData{
    from  :number;
    item  ?: Dialog;
    items ?: Dialog[];
}