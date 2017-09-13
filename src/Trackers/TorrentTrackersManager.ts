import {RutrackerWrapper} from "./RutrackerWrapper"
import {ITorrentTrackerSearchResult, TorrentTrackerId, TorrentTrackerType } from "./Interfaces";
import {ITorrentTrackersManagerSettings} from "../Config";

export class TorrentTrackerManager {
	private readonly rutracker = new RutrackerWrapper();
	
	constructor(settings: ITorrentTrackersManagerSettings) {
		this.rutracker.login(settings.rutrackerSettings);
	}

	async download(torrentTrackerId: TorrentTrackerId): Promise<string> {
		if (torrentTrackerId.type === TorrentTrackerType.Kinopoisk) {
			return await this.rutracker.download(torrentTrackerId.id);
		}

		return Promise.reject(`Unsupported torrent tracker type ${torrentTrackerId.type}`);
	}

	async search(query: string): Promise<ITorrentTrackerSearchResult[]> {
		return await this.rutracker.search(query);
	}
}