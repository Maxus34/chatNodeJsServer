import { Dialog, DialogReference } from "./chat.models";

export class User{
    
    public id        :number;
    public username  :string;
    public email     :string;

    public dialogs :Dialog[];

    constructor(data){
        this.id       = data.user.id;
        this.username = data.user.username;
        this.email    = data.user.email;
        
        this.dialogs = data.dialogs;
    }
}   

