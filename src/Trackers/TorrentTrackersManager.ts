import {RutrackerAdapter} from "./RutrackerAdapter"
import {ITorrentTrackerSearchResult,  ITorrentInfo, TorrentTrackerType, ITorrentTrackerAdapter, ITorrentDownloadInfo, MovieSearchInfo } from "./Interfaces";
import {ITorrentTrackersManagerSettings} from "../Config";
import { ThePirateBayAdapter } from "./ThePirateBayAdapter";
import { RarbgAdapter } from "./RarbgAdapter";

export class TorrentTrackerManager {
	private readonly trackers: Map<TorrentTrackerType, ITorrentTrackerAdapter>
	
	constructor(settings: ITorrentTrackersManagerSettings) {
		this.trackers = new Map<TorrentTrackerType, ITorrentTrackerAdapter>();
		this.trackers.set(TorrentTrackerType.Rutracker, new RutrackerAdapter(settings.rutrackerSettings));
		this.trackers.set(TorrentTrackerType.ThePirateBay, new ThePirateBayAdapter());
		this.trackers.set(TorrentTrackerType.Rarbg, new RarbgAdapter());
	}

	async download(torrentTrackerId: ITorrentInfo): Promise<ITorrentDownloadInfo> {
		if (!this.trackers.has(torrentTrackerId.type)) {
			throw `Unsupported torrent tracker type ${torrentTrackerId.type}`;
		}
		
		var tracker = this.trackers.get(torrentTrackerId.type);
		return await tracker.download(torrentTrackerId);
	}

	async search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {
		var res = await this.getSearchResults(searchInfo);
		return this.applyFilters(res, searchInfo.isTvShow);
	}

	private async getSearchResults(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {
		var tasks: Promise<ITorrentTrackerSearchResult[]>[] = [];
		for(let tracker of this.trackers.values())
		{
			tasks = [...tasks, this.searchInTracker(tracker, searchInfo)];
		}

		return (await Promise.all(tasks)).reduce((a,b) => a.concat(b));
	}	

	private async searchInTracker(tracker: ITorrentTrackerAdapter, searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]>
	{
		var containsCyrillicLetters = /[а-яА-ЯЁё]/.test(searchInfo.title);
		if(containsCyrillicLetters && !tracker.isRus())
		{
			console.info(`search string contains cyrillic letters. Skip tracker ${tracker.Key}.`)
			return [];
		}

		try
		{
			var results = await tracker.search(searchInfo);			
			console.info(`found ${results.length} torrents on tracker ${tracker.Key}`)
			return results;
		}
		catch(e)
		{
			console.error(`Error occured on search request with query ${searchInfo.toString("s")} on tracker ${tracker.Key}. Details: ${e}`)
			return [];
		}
	}

	private applyFilters(results: ITorrentTrackerSearchResult[], isTvShow : boolean): ITorrentTrackerSearchResult[]
	{
		var res = results.filter(x => x.seeds >= 1);
		console.log(`left ${res.length} torrents after filtration by seeds`);

		if(isTvShow)
			res = this.applyFilterIfNotEmptyResult(results, x => x.sizeGb <= 60 && x.sizeGb >= 15);
		else
			res = this.applyFilterIfNotEmptyResult(results, x => x.sizeGb <= 25 && x.sizeGb >= 7);
		
		console.log(`left ${res.length} torrents after filtration by size`);
		
		res = this.applyFilterIfNotEmptyResult(res, x => x.isHD);
		console.log(`left ${res.length} torrents after filtration by category HD Video`);

		var groupedByTracker = ArrayHelper.groupBy(res, x => x.id.type);
		var result: ITorrentTrackerSearchResult[] = [];
		groupedByTracker.forEach(val => result = [...result, ...val.sort((a, b) => b.sizeGb - a.sizeGb).slice(0, 3)]);
		return result;		
	}

	private applyFilterIfNotEmptyResult<T>(arr: T[],
		predicate: (value: T) => boolean): T[] {
		const filteredResults = arr.filter(predicate);
		return filteredResults.length === 0 ? arr : filteredResults;
	}
}

class ArrayHelper
{	
	static groupBy<T, TKey>(list: Array<T>, keySelector: (value: T) => TKey): Map<TKey, T[]> {
		const map = new Map<TKey, T[]>();
		list.forEach((item) => {
			const key = keySelector(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return map;
	}
}