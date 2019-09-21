import { servicesReporitory } from "./ServiceLocator"
import {ITorrentTrackerSearchResult, ITorrentInfo } from "./Trackers/Interfaces";

export class MoviesDownloaderService {

	async GetApplicableTorrents(kinopoiskId: number): Promise<ITorrentTrackerSearchResult[]> {
		console.info(`Requested film with id ${kinopoiskId}`);
		const film = await servicesReporitory.kinopoisk.getById(kinopoiskId);
		const query = `${film.title} ${film.year} ${film.director}`;
		console.dir(`Rutracker search string: '${query}'`);
		return await servicesReporitory.torrentTrackerManager.search(query);
	}

	async AddTorrent(torrentTrackerIdStr: string): Promise<ITransmissionAddTorrentResult> {
		const torrentTrackerId : ITorrentInfo = JSON.parse(torrentTrackerIdStr);
		const torrent = await servicesReporitory.torrentTrackerManager.download(torrentTrackerId);
		if(torrent.torrentFileContentBase64)
		{
			return await servicesReporitory.transmissionClient.addBase64(torrent.torrentFileContentBase64);
		}		
		else if(torrent.magnetLink)
		{
			return await servicesReporitory.transmissionClient.addMagnet(torrent.magnetLink, null);
		}
		else
		{
			throw `unable to download torrent ${torrentTrackerId}`;			
		}
	}
}

export interface ITransmissionAddTorrentResult {
	hashString: string,
	id: number,
	name: string,
}