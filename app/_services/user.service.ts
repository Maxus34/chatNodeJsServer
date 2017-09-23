import * as request from "request";
import { User } from "../_models/user";
import { ServiceLocator } from "./service.locator";

export class UserService{
    
    protected apiService = ServiceLocator.getInstance().apiService;

    public async getByAccessToken(token :string) :Promise<User>{
       try{
         var response :any = await this.apiService.postApi('ws.getUserInfo', token);
       } catch(e) { console.log(e); }
        
        let user = new User(response);
        
        return user;
    }

    public async checkToken(token :string) :Promise<boolean>{
        let response;

        try{
            response = await this.apiService.postApi('check-access', token);
        } catch (e) {console.log(e); }

        return response.status == 'success' ? true : false;
    }
}

 