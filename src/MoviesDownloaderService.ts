import { servicesReporitory } from "./ServiceLocator"
import {ITorrentTrackerSearchResult, TorrentTrackerId } from "./Trackers/Interfaces";

export class MoviesDownloaderService {

	async GetApplicableTorrents(kinopoiskId: number): Promise<ITorrentTrackerSearchResult[]> {
		console.info(`Requested film with id ${kinopoiskId}`);
		const film = await servicesReporitory.kinopoisk.getById(kinopoiskId);
		const query = `${film.title} ${film.year} ${film.director}`;
		console.dir(`Rutracker search string: '${query}'`);
		return await servicesReporitory.torrentTrackerManager.search(query);
	}

	async AddTorrent(torrentTrackerIdStr: string): Promise<ITransmissionAddTorrentResult> {
		const torrentTrackerId = TorrentTrackerId.parseFromString(torrentTrackerIdStr);
		const torrentFileContentBase64 = await servicesReporitory.torrentTrackerManager.download(torrentTrackerId);
		return await servicesReporitory.transmissionClient.addBase64(torrentFileContentBase64);
	}
}

export interface ITransmissionAddTorrentResult {
	hashString: string,
	id: number,
	name: string,
}