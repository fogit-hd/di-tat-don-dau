import {io,type ManagerOptions,type SocketOptions} from 'socket.io-client'
/** A factory, NOT a singleton: every game owns its connection and lifecycle. */
export function createGameSocket(url:string|undefined,options:Partial<ManagerOptions & SocketOptions>){
 return io(url,{transports:['websocket','polling'],reconnection:true,...options})
}
