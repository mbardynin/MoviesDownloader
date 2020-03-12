var rutrackerApi = require("rutracker-api");
import {ILoginPassword} from "../Config";
import { ITorrentDownloadInfo, ITorrentInfo, ITorrentTrackerAdapter, ITorrentTrackerSearchResult, MovieSearchInfo, TorrentTrackerType } from "./Interfaces";

export class RutrackerAdapter implements ITorrentTrackerAdapter {	
	readonly Key: TorrentTrackerType = TorrentTrackerType.Rutracker;
	readonly rutracker: any;
	constructor(options: ILoginPassword)
	{
		this.rutracker = new rutrackerApi();
		this.rutracker.login( { username: options.login, password: options.password})
		.then(() => {
		  console.log('Rutracker: Authorized');
		})
		.catch(err => console.error(err));
	}

	isRus() : boolean{ return true; }

	async download(rutrackerId: ITorrentInfo): Promise<ITorrentDownloadInfo> {
		var fileContent = await this.downloadFile(rutrackerId.id);
		return { torrentFileContentBase64: fileContent }
	}

	async search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {		
		var torrents = await this.rutracker.search({ query: searchInfo.toString("сезон "), sort: 'size' });		
		let convertedResults: ITorrentTrackerSearchResult[] = torrents.map( (x) => {
			return {
				id: {type:TorrentTrackerType.Rutracker, id: x.id},
				state: x.state,
				category: x.category,
				title: x.title,
				sizeGb: Math.round((x.size / (1024 * 1024 * 1024)) * 10) /10,
				seeds: x.seeds,
				url: x.url	,
				isHD: x.category.includes("(HD Video)")					
			};});
	
		convertedResults = convertedResults
			.filter(this.notDvd)
			.filter(this.not3d)
			.filter(this.notForAppleTv);
		
		return convertedResults
	}

	private async downloadFile(rutrackerId: number) : Promise<string>
	{
		return new Promise<string>(async (resolve) => {
			var response = await this.rutracker.download(rutrackerId)				
			var chunks = [];
			response.on("data", chunk => {
				chunks.push(chunk);
			});

			response.on("end", () => {
				const torrentFileContentBase64 = Buffer.concat(chunks).toString("base64");
				resolve(torrentFileContentBase64);
			});
		});
	}

	private notDvd(element: ITorrentTrackerSearchResult) {
		return !element.category.includes("(DVD)") && !element.category.includes("(DVD Video)");
	}

	private not3d(element: ITorrentTrackerSearchResult) {
		return !element.category.includes("3D");
	}

	private notForAppleTv(element: ITorrentTrackerSearchResult) {
		return element.category !== "Фильмы HD для Apple TV";
	}
}