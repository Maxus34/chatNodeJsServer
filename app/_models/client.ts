import { User } from "./user";
import * as socketIo from "socket.io";

export class WsClient extends User{

    public socket :SocketIO.Socket;
    
    constructor (data){
        super(data);
    }
}