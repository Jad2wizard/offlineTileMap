/**
 * Created by Jad on 2017/7/28.
 */
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

class WS{
    constructor(){
        this.wss = null;
        this.currWS = null;
        this.createWS = this.createWS.bind(this);
        this.send = this.send.bind(this);
    }

    createWS(server){
        this.wss = new WebSocketServer({
            server: server
        });
        this.wss.on('connection', (ws) => {
            this.currWS = ws;
            console.log('[SERVER] connection');
            ws.onmessage = (msg) => {
                console.log(msg.data);
            }
        });
        this.wss.broadcast = (data) => {
            wss.clients.forEach(client => {
                client.send(data);
            });
        };
    }

    send(data){
        if(this.currWS) {
            this.currWS.send(data);
        }
    }
}

const ws = new WS();
module.exports = ws;
