import * as request from "request";

export class ApiService{
    
    protected apiUrl :string = `http://192.168.33.10/chat/api`;

    public postApi(method, token, data ?:any){
        return new Promise( (resolve) => {
            request.post(
                `${this.apiUrl}/${method}?access-token=${token}`, data,
                function (error, response, body){
                    if (!error && response.statusCode == 200){
                        try{
                            let res = JSON.parse(body);
                            resolve(res.response);
                        }catch(e) {console.log(e);}
                    
                    } else if (!error) {
                        //console.log(`Error in ApiS `, response);
                        //throw new Error(response.statusMessage);
                    } else {
                        throw new Error(error);
                    }
                }
            );
        });
    }

}