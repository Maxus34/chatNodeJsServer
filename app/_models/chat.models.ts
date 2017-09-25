export interface Dialog{
    id        :number;
    title     :string;
    isCreator :boolean;
    creatorId :boolean;

    dialogReferences :DialogReference[];
}

export interface DialogReference{
    id        :number;
    userId    :number;
    createdAt :number;
    createdBy :number;
    isActive  :boolean;
}