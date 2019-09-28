import { Server } from "./Server";
import { servicesReporitory } from "./ServiceLocator"

// allow self-signed ssl certificate for connection to Transmission on router.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.on('unhandledRejection', (reason) => {
	console.error(reason);
});

servicesReporitory.telegramBot.activate();

let server = new Server();
server.defineRoutes();
server.startListening();