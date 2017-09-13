import { Config } from "./Config"
import { KinopoiskWrapper } from "./MoviesInfoSources/KinopoiskWrapper"
import { Transmission } from "transmission-client"
import { MoviesDownloaderTelegramBot } from "./MoviesDownloaderTelegramBot"
import { MoviesDownloaderService } from "./MoviesDownloaderService"
import { TorrentStatusManager } from "./TorrentStatusManager"
import { TorrentTrackerManager } from "./Trackers/TorrentTrackersManager";

class ServiceLocator {
	config = require('config') as Config;
	kinopoisk = new KinopoiskWrapper(this.config.kinopoiskSettings);
    torrentTrackerManager = new TorrentTrackerManager(this.config.torrentTrackerSettings);
	transmissionClient = new Transmission(this.config.transmissionSettings);
	telegramBot = new MoviesDownloaderTelegramBot(this.config.telegramBotSettings);
	moviesDownloaderService = new MoviesDownloaderService();
	torrentStatusManager = new TorrentStatusManager();

	constructor() {
		this.transmissionClient.addListener("reject", (err) => { console.error(err) });
	}
}

export let servicesReporitory = new ServiceLocator();