import * as redis from 'redis';
import * as events from 'events';


export class RedisService{
    
    public events = new events.EventEmitter();

    protected subscriberClient :redis.RedisClient;

    public constructor(){
        try{
            this.subscriberClient = redis.createClient({
                host: "192.168.33.10",
                port: 6379
            });
        } catch(e) { console.log(e); }
        

        this.subscribeOnRedisEvents();
    }
    
    public getClient() {
        return this.subscriberClient;
    }

    protected subscribeOnRedisEvents(){
        
        this.subscriberClient.subscribe("chatEvents");
    
        this.subscriberClient.on("message", (channel, message)=>{
            let eventData;
            try{
                eventData = JSON.parse(message);
            } catch(e) {console.log(`Error in RedisService `, e);}

            this.events.emit(eventData.event, eventData.data);
        });

    } 
}