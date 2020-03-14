import { servicesReporitory } from "./ServiceLocator"
import { TorrentTrackerType } from "./Trackers/Interfaces";
let express = require("express");
let app = express();

export class Server {
	startListening() {
		let port = process.env.port || servicesReporitory.config.port;
		app.listen(port, (err) => {
			if (err) {
				return console.log(err)
			}

			return console.log(`server is listening on ${port}`)
		});
	}

	defineRoutes() {
		const self = this;
		
		// WebHook for bot
		if(servicesReporitory.config.telegramBotSettings.useWebHooks)
        {
			app.use(servicesReporitory.telegramBot.webhookCallback());
		}
		
		app.get("/", (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			res.json({
				API: ["/ShowRequestHeaders",
					"/GetApplicableTorrents/:kinopoiskId",
					"/GetActiveTorrents",
					"/AddTorrent/:torrentTrackerId"]
			});
		});
		app.get("/GetApplicableTorrents/:kinopoiskId", async (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			try {
				const rutrackerResults = await servicesReporitory.moviesDownloaderService.GetApplicableTorrents(req.params.kinopoiskId);
				res.json(rutrackerResults);
			}
			catch (e) {
				console.log(e);
				res.sendStatus(500);
			}
		});
		app.get("/AddTorrent/:torrentTrackerId", async (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			try {
				const rutrackerResults = await servicesReporitory.moviesDownloaderService.AddTorrent({type: TorrentTrackerType.Rutracker, id: req.params.rutrackerId});
				res.json(rutrackerResults);
			}
			catch (e) {
				console.log(e);
				res.sendStatus(500);
			}
		});
		app.get("/ShowRequestHeaders", (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			res.json(req.headers);
		});
		app.get("/GetActiveTorrents", async (req, res) => {
			if (!self.checkPrincipal(req)) {
				res.sendStatus(403);
				return;
			}
			try {
				const torrents = await servicesReporitory.transmissionClient.active();
				res.json(torrents);
			}
			catch (e) {
				console.log(e);
				res.sendStatus(500);
			}
		});
	}

	private checkPrincipal(req) {
		const principalName = req.get("x-ms-client-principal-name") || "any";
		if (servicesReporitory.config.allowedGoogleAccounts.indexOf(principalName) !== -1) {
			return true;
		}

		return false;
	}
}