import { RedisService } from './redis.service';
import { UserService } from "./user.service";
import { ApiService }  from "./api.service";

export class ServiceLocator{
    
    private static _instance :ServiceLocator;

    protected _userService :UserService;
    protected _apiService  :ApiService;
    protected _redisService :RedisService;

    protected constructor(){ }
    
    public static getInstance(){
        
        if (!this._instance){
            this._instance = new ServiceLocator();
        }

        return this._instance;
    }

    public get userService(){
        if (!this._userService)
            this._userService = new UserService();

        return this._userService;
    }

    public get apiService(){
        if (!this._apiService)
            this._apiService = new ApiService();

        return this._apiService;
    }

    public get redisService(){
        if (!this._redisService)
            this._redisService = new RedisService();

        return this._redisService;
    }
}