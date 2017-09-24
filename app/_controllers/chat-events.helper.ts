import { WsClient } from "../_models/client";
import { ServiceLocator } from "../_services/service.locator";

import { RedisMessageEventData, RedisDialogEventData } from "../_models/redis.chat.events";
import { Dialog, DialogReference } from "../_models/chat.models";

export class ChatEventsHelper{
    
    protected clients :WsClient[] = [];
    protected dialogs :Dialog[]   = [];


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
         
        this.handleDialogsListToNewCliens(client);
    }
    
    // Remove dialogs from WsClient to this.dialogs Arrray;
    protected handleDialogsListToNewCliens(client :WsClient) {
        client.dialogs.forEach( (dialog :Dialog) => {
            
            let dialogExists = this.dialogs.find( (e_dialog) => {
                return dialog.id == e_dialog.id;
            });
        
            if (!dialogExists){
                
                console.log(`Added dialog\n`, dialog);
                this.dialogs.push(dialog);

            } else {
                dialogExists = dialog;
                console.log(`Updated dialog\n`, dialog);
            }
        });

        client.dialogs = [];
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
        
        console.log(`Got dialog.created event!`, eventData.item);

        let fromId           = eventData.from;
        let dialogId         = eventData.item.id;
        let dialogReferences = eventData.item.dialogReferences;
        
        let usersToSendEvent = new Array<WsClient>();
        
        // Adding a new Dialog;
        this.dialogs.push(eventData.item);

        dialogReferences.forEach( (reference :DialogReference) => {
            
            if (reference.isActive){
                let wsClientForCurrentReference = this.clients.find( (client) => {
                    return client.id == reference.userId && client.id !== fromId;
                });

                if (wsClientForCurrentReference){
                    usersToSendEvent.push(wsClientForCurrentReference);
                }
            }

        });

        // Sending events to clients;
        usersToSendEvent.forEach( (wsClient) => {
            console.log(`Sending to`, wsClient.username);
            wsClient.socket.emit('dialog.created', JSON.stringify(eventData));
        });      
    }
    
    protected handleDialogUpdatedEvent(eventData :RedisDialogEventData ){
        console.log(`Got dialog.updated event!`, eventData.item);
        
        let fromId           = eventData.from;
        let dialogId         = eventData.item.id;
        let dialogReferences = eventData.item.dialogReferences;
                
        let usersThatWereAddedInDialog = new Array<number>();
        let usersThatWereInDialog      = new Array<number>();
        
        let currentDialog = this.dialogs.find( (dialog) => {
            return dialog.id == dialogId; 
        });
    
        if (currentDialog){
            // dialogReferences - new DialogReferences from eventData.
            for (let i = 0; i < dialogReferences.length; i++){
               
                // Searching references collision;
                let isNewUser = true;
                for (let j = 0; j < currentDialog.dialogReferences.length; j++){             
                    if (dialogReferences[i].userId == currentDialog.dialogReferences[j].userId){
                        isNewUser = false;
                    }
                }
                
                if (dialogReferences[i].userId !== fromId){
                    if(isNewUser){
                        usersThatWereAddedInDialog.push(dialogReferences[i].userId);
                    } else {
                        usersThatWereInDialog.push(dialogReferences[i].userId);
                    }
                }
            }

        } else {
            console.log(`Some is Wrong. Cant find dialog#${dialogId}`);
            return;
        }
        
        currentDialog = eventData.item;
        console.log(`Current Dialog changed to`, currentDialog);
        
        // Sending evets to clients.
        this.clients.forEach( (client) => {
            if (usersThatWereInDialog.indexOf(client.id) >= 0){
                console.log(`Sending to [was in dialog]`, client.username);
                client.socket.emit('dialog.updated', JSON.stringify(eventData));
            } else 
            if (usersThatWereAddedInDialog.indexOf(client.id) >= 0){
                console.log(`Sending to [was added]`, client.username);
                client.socket.emit('dialog.created', JSON.stringify(eventData));
            }
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
            wsClient.socket.emit("user.typing", JSON.stringify(eventData));
        });
    }
    // ---------------------------------------------------
    

    protected findClientsForSendEvent(dialogId :number, currentClientId :number) :WsClient[]{
        
        let dialog = this.dialogs.find( (dialog) => {
            return dialog.id == dialogId;
        });
        let usersToSendEvent = new Array<WsClient>();

        if (dialog){
            dialog.dialogReferences.forEach( (reference) => {
                if ( (reference.isActive == true) && (reference.userId !== currentClientId) ){
                    
                    let currentWsUserForReference = this.clients.find( (client) => {
                        return client.id == reference.userId;
                    });    
                
                    if (currentWsUserForReference){
                        usersToSendEvent.push(currentWsUserForReference);
                        console.log(`Adding to send reference\n`, reference);
                    }
                }
            });

        } else {
            console.log(`Something is wrong. Cant find dialog#${dialogId}`);
        }
            
        return usersToSendEvent;
    }   
}  