import * as socketIo from 'socket.io';

import { WsClient } from "../_models/client";
import { ServiceLocator } from "../_services/service.locator";
import { ChatEventsHelper } from './chat-events.helper';

export class IoController {

    protected clients: WsClient[] = [];

    protected io: SocketIO.Server;

    protected userService      = ServiceLocator.getInstance().userService;
    protected chatEventsHelper = new ChatEventsHelper(this.clients);

    constructor(io: SocketIO.Server) {
        this.io = io;
        
        this.handleConnectionWithAccessToken();
    }


    protected handleSocketEvents(wsClient :WsClient) {
        wsClient.socket.on('disconnect', () => {
            this.deleteWsClient(wsClient);
        });

        this.chatEventsHelper.attachEventsTooClient(wsClient);
    }

    
    protected handleConnectionWithAccessToken() {
        this.io.use( async (socket: SocketIO.Socket, next) => {
            
            // If got access-token in connection;
            if (socket.handshake.query && socket.handshake.query.access_token) {

                let token = socket.handshake.query.access_token;
                
                let tokenCheckingResult :boolean;
                try{
                    tokenCheckingResult = await this.userService.checkToken(token);
                } catch(e) {console.log(e);}
                

                if (tokenCheckingResult){
                    this.addWsClient(token, socket);
                    next();
                } 
                
                next(new Error("Token isn`t valid"));
            } else {
                next(new Error("Auth error"));
            }
        });
    }
 

    protected async deleteWsClient(wsClient :WsClient) {
        this.clients.forEach((item, i, arr) => {
            // Finding disconnected user in list and deleting him;
            if (item.id == wsClient.id) {
                console.log(`[x]Disconnect and delete ${item.username}`);
                this.clients.splice(i, 1);
            }
        })
    }


    protected async addWsClient(token :string, socket: SocketIO.Socket) :Promise<WsClient>{
        let wsClient = await this.userService.getByAccessToken(token) as WsClient;

        wsClient.socket = socket;

        console.log(`[+]Connected ${wsClient.username}`);
        
        this.clients.push(wsClient);
        
        this.handleSocketEvents(wsClient);

        return wsClient;
    }
}