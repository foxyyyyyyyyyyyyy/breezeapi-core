import { WebSocketHandler } from '@Types';

export const handler: WebSocketHandler = {
    open(ws, id) {
        console.log(`WebSocket opened with ID: ${id}`);
    },
    message(ws, message, id) {
        console.log(`Message received from ID ${id}:`, message);
    },
    close(ws, code, reason, id) {
        console.log(`WebSocket closed with ID ${id}. Code: ${code}, Reason: ${reason}`);
    },
};
