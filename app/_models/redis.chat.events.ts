import {Dialog, DialogReference } from "./chat.models";

export interface RedisMessageEventData{
    dialogId :number;
    from     :number;
    item     ?:any;
    items    ?:any[];
}

export interface RedisDialogEventData{
    from  :number;
    item  ?: Dialog;
    items ?: Dialog[];
}