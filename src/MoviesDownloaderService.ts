import { servicesReporitory } from "./ServiceLocator"
import {ITorrentTrackerSearchResult, ITorrentInfo, MovieSearchInfo } from "./Trackers/Interfaces";
import { IKinopoiskMovieInfo } from "./MoviesInfoSources/KinopoiskWrapper";

export class MoviesDownloaderService {

	async GetSearchResult(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		console.info(`Requested film with id ${kinopoiskId}`);
		return await servicesReporitory.kinopoisk.getById(kinopoiskId);
	}

	async GetApplicableTorrents(movieInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {
		console.dir(`Search string: '${movieInfo.toString("s")}'`);
		return await servicesReporitory.torrentTrackerManager.search(movieInfo);
	}

	async AddTorrent(torrentInfo: ITorrentInfo): Promise<ITransmissionAddTorrentResult> {
		const torrent = await servicesReporitory.torrentTrackerManager.download(torrentInfo);
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
			throw `unable to download torrent ${torrentInfo}`;			
		}
	}
}

export interface ITransmissionAddTorrentResult {
	hashString: string,
	id: number,
	name: string,
}