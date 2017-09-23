
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

interface Dialog{
    id        :number;
    title     :string;
    isActive  :boolean;
    isCreator :boolean;
    creatorId :boolean;

    dialogReferences :DialogReference[];
}

interface DialogReference{
    id        :number;
    userId    :number;
    createdAt :number;
    createdBy :number;
    isActive  :number;
}