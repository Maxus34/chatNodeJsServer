
export class User{
    
    public id :number;
    public username :string;
    public email :string;

    public dialogs :Dialog[];

    constructor(data){
        this.id       = data.user.id;
        this.username = data.user.username;
        this.email    = data.user.email;
        
        this.dialogs = data.dialogs;
    }
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