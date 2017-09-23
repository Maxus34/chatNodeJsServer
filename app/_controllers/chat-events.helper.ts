import { WsClient } from "../_models/client";
import { ServiceLocator } from "../_services/service.locator";
import { RedisMessageEventData, RedisDialogEventData } from "../_models/redis.chat.events";

export class ChatEventsHelper{
    
    protected clients :WsClient[] = [];
    protected redisService = ServiceLocator.getInstance().redisService;

    public constructor(clients: WsClient[], ){ 
        this.clients = clients;

        this.subscribeToRedisEvents();
    }
    
    
    public subscribeToRedisEvents(){
        this.redisService.events.on('message.created', this.handleMessageCreatedEvent.bind(this));
        this.redisService.events.on('message.updated', this.handleMessageUpdatedEvent.bind(this));

        this.redisService.events.on('dialog.created', this.handleDialogCreatedEvent.bind(this));
        this.redisService.events.on('dialog.updated', this.handleDialogUpdatedEvent.bind(this));
    }


    public attachEventsTooClient(client :WsClient){
        client.socket.on('user.typing', (msg) =>{
           this.handleUserTypingEvent(client, msg);
        });
    }
    
    // ---------------Message Events --------------------
    protected handleMessageCreatedEvent(eventData :RedisMessageEventData){
        console.log(`ChatEventsHelper got event message.created`, eventData);
        
        let dialogId = eventData.dialogId;
        let fromId   = eventData.from;
        
        if (dialogId && fromId){
            let usersToSend = this.findClientsForSendEvent(dialogId, fromId);
            
            usersToSend.forEach( (wsClient :WsClient) => {
                wsClient.socket.emit("message.created", JSON.stringify(eventData));
                console.log(`Sended to`, wsClient.username);
            });

        } else {
            console.log(`Wrong msg`, eventData);
        }
    }

    protected handleMessageUpdatedEvent(eventData :RedisMessageEventData){
        console.log(`ChatEventsHelper got event message.updated`, eventData);
        
        let dialogId = eventData.dialogId;
        let fromId   = eventData.from;
        
        if (dialogId && fromId){
            let usersToSend = this.findClientsForSendEvent(dialogId, fromId);

            usersToSend.forEach( (wsClient :WsClient) => {
                wsClient.socket.emit("message.updated", JSON.stringify(eventData));
            });

        } else {
            console.log(`Wrong msg`, eventData);
        }
    }
    // ---------------------------------------------------
    

    // -------------- Dialog Events ----------------------
    protected handleDialogCreatedEvent(eventData :RedisDialogEventData ){
        
        console.log(`Got dialog.created event!`, eventData);

        let fromId           = eventData.from;
        let dialogId         = eventData.item.id;
        let dialogReferences = eventData.item.dialogReferences;
        
        let usersToSendEvent = new Array<WsClient>();
        
        if (!fromId || !dialogId || !dialogReferences){
            console.log(`Wrong data got in dialogCreatedEvent `, eventData);
            return;
        }
        
        
        // Adding a new Dialog to current user;
        let currentUser = this.clients.find( (client) => {
            return client.id == fromId;
        });
        currentUser.dialogs.push(eventData.item);

        // Adding a new Dialog to users, by references;
        dialogReferences.forEach( (reference) => {
            
            let wsClient = this.clients.find( (client) => {
                return client.id == reference.userId;
            });
            
            if (wsClient){
                console.log(`Founded client ${wsClient.username}, adding dialog ${dialogId}`);
                wsClient.dialogs.push(eventData.item);

                usersToSendEvent.push(wsClient);
            }
        });
        

        // Sending events to clients;
        usersToSendEvent.forEach( (wsClient) => {
            console.log(`Sending to`, wsClient.username);
            wsClient.socket.emit('dialog.created', JSON.stringify(eventData));
        });      
    }

    protected handleDialogUpdatedEvent(eventData :RedisDialogEventData ){
        console.log(`Got dialog.updated event!`, eventData, eventData.item.dialogReferences);
        
        let fromId           = eventData.from;
        let dialogId         = eventData.item.id;
        let dialogReferences = eventData.item.dialogReferences;
                
        let usersThatWereAddedInDialog = new Array<WsClient>();
        let usersThatWereInDialog      = new Array<WsClient>();


        if (!fromId || !dialogId || !dialogReferences){
            console.log(`Wrong data got in dialogUpdatedEvent `, eventData);
            return;
        }
        
        // Refreshing dialog in currentWsUser
        let currentWsUser = this.clients.find( (client) => {
            return client.id == fromId;
        });
        if (currentWsUser){
            let currentWsUserDialog = currentWsUser.dialogs.find( (dialog) => {
                return dialog.id == dialogId;
            });

            if (currentWsUserDialog){
                currentWsUserDialog = eventData.item;
            }
        }

        // Refreshing dialogs in users by new dialogReferences
        dialogReferences.forEach( (reference) => {
            
            let wsClientFromDialogReference = this.clients.find( (client) => {
                return client.id == reference.userId && client.id !== fromId;
            });
            
            // If client online.            
            if(wsClientFromDialogReference){
                let dialogToUpdate = wsClientFromDialogReference.dialogs.find( (dialog) => {
                    return dialog.id == dialogId;
                });
                
                // If client was in this dialog - update
                if (dialogToUpdate){
                    dialogToUpdate = eventData.item;
                    usersThatWereInDialog.push(wsClientFromDialogReference);
                    
                // If client wasn`t in this dialog - add;
                } else {
                    wsClientFromDialogReference.dialogs.push(eventData.item);
                    usersThatWereAddedInDialog.push(wsClientFromDialogReference);
                }
            }
        });
                
        
        

        // Sending events to clients;
        usersThatWereAddedInDialog.forEach( (wsClient) => {
            console.log(`Sending to [was added]`, wsClient.username);
            wsClient.socket.emit('dialog.created', JSON.stringify(eventData));
        });    
        usersThatWereInDialog.forEach( (wsClient) => {
            console.log(`Sending to [was in dialog]`, wsClient.username);
            wsClient.socket.emit('dialog.updated', JSON.stringify(eventData));
        });      
    }
    // ---------------------------------------------------
    
    
    // -------------- User Events ----------------------
    protected handleUserTypingEvent(client:WsClient, eventData :any){
        
        eventData = JSON.parse(eventData);

        console.log(`\nGot event -- [TYPING][dID: ${eventData.dialogId}] from ${client.username}`, eventData);
           
        let usersToSendEvent = this.findClientsForSendEvent(eventData.dialogId, client.id);

        usersToSendEvent.forEach( (wsClient :WsClient) => {
            console.log(`Sending to`, wsClient.username);
            wsClient.socket.emit("user.typing", JSON.stringify({
                dialogId : eventData.dialogId,
                userId : eventData.userId
            }));
        });
    }
    // ---------------------------------------------------
    

    protected findClientsForSendEvent(dialogId :number, currentClientId :number){
        
        let currentClient = this.clients.find( (client) => {
            return client.id == currentClientId;
        });

        let dialog = currentClient.dialogs.find( (item) => {
            return item.id == dialogId;
        });
        
        let usersToSendEvent = new Array<WsClient>();

        if (dialog){   
            dialog.dialogReferences.forEach( (reference) => {
                
                if (reference.isActive){
                    let wsClientToSendEvent = this.clients.find( (client) => {
                        return client.id == reference.userId && client.id !== currentClientId;
                    });
                    
                    if (wsClientToSendEvent)
                        usersToSendEvent.push(wsClientToSendEvent);
                }
            });
        }

        return usersToSendEvent;
    }
}  