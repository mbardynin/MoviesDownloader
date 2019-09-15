var rutrackerApi = require("rutracker-api");
var filesizeParser = require("filesize-parser");
import {ILoginPassword} from "../Config";
import {ITorrentTrackerSearchResult, TorrentTrackerType, TorrentTrackerId } from "./Interfaces";

export class RutrackerWrapper {
	rutracker: any;
	constructor()
	{
		this.rutracker = new rutrackerApi();
	}

	login(options: ILoginPassword) {
		this.rutracker.login(options.login, options.password)
		.then(() => {
		  console.log('Rutracker: Authorized');
		})
		.catch(err => console.error(err));
	}

	async download(rutrackerId: number): Promise<string> {
		return new Promise<string>((resolve) => {
			this.rutracker.download(rutrackerId, response => {
				var chunks = [];
				response.on("data", chunk => {
					chunks.push(chunk);
				});

				response.on("end", () => {
					const torrentFileContentBase64 = Buffer.concat(chunks).toString("base64");
					resolve(torrentFileContentBase64);
				});
			});
		});
	}

	async search(query: string): Promise<ITorrentTrackerSearchResult[]> {
		return new Promise<ITorrentTrackerSearchResult[]>((resolve) => {
			this.rutracker.search(query, torents => {
				let convertedResults: ITorrentTrackerSearchResult[] = torents.map( (x) => {
					return {
						id: TorrentTrackerId.create(TorrentTrackerType.Kinopoisk, x.id),
						state: x.state,
						category: x.category,
						title: x.title,
						sizeGb: Math.round((filesizeParser(x.size) / (1024 * 1024 * 1024)) * 10) /10,
						seeds: x.seeds,
						url: x.url						
					};
				});

				console.info(`find ${convertedResults.length} torrents`);
				convertedResults = convertedResults
					.filter(this.notDvd)
					.filter(this.not3d)
					.filter(this.notForAppleTv)
					.filter(this.atLeast1Seed);

				convertedResults = this.applyFilterIfNotEmptyResult(convertedResults, this.haveAppropriateSize);
				console.info(`left ${convertedResults.length} torrents after filtration by size`);
				
				convertedResults = this.applyFilterIfNotEmptyResult(convertedResults, this.isHdVideo);
				console.info(`left ${convertedResults.length} torrents after filtration by category HD Video`);
				
				resolve(convertedResults.sort((a, b) => b.sizeGb - a.sizeGb).slice(0, 8));
			});
		});
	}

	private applyFilterIfNotEmptyResult<T>(arr: T[],
		filter: (value: T, index: number, array: T[]) => boolean): T[] {
		const filteredResults = arr.filter(filter);
		return filteredResults.length === 0 ? arr : filteredResults;
	}

	private haveAppropriateSize(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) { 
		return (element.sizeGb <= 25 && element.sizeGb >= 7);
	}

	private notDvd(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) {
		return !element.category.includes("(DVD)") && !element.category.includes("(DVD Video)");
	}

	private not3d(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) {
		return !element.category.includes("3D");
	}

	private notForAppleTv(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) {
		return element.category !== "Фильмы HD для Apple TV";
	}

	private isHdVideo(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) {
		return element.category.includes("(HD Video)");
	}

	private atLeast1Seed(element: ITorrentTrackerSearchResult, index: number, array: ITorrentTrackerSearchResult[]) {
		return element.seeds >= 1;
	}
}