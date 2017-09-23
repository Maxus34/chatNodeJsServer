import { Server } from 'https';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as http from 'http';

import { IoController } from "./_controllers/io.controller";
import { UserService }  from "./_services/user.service";

export class App{
    
        private app :express.Application;
        private server;
        private io :SocketIO.Server;
        
        public static bootstrap(config ?:any){
            new App(config);
        }
    
        private constructor( config ?:any){
            this.app    = express();
            this.server = http.createServer(this.app);
            this.io     = socketIo(this.server);
    
            this.appConfig();
        }
    
        protected appConfig(){
            
            let ioController = new IoController(this.io);

            this.app.get('/', async (req, res, next) => {

                let userService = new UserService();
                
                let user = await userService.getByAccessToken('abcdef');

                res.send(JSON.stringify(user));
            });
    
            this.server.listen(3000);
        }
    }