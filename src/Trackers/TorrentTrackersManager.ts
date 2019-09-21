import {RutrackerAdapter} from "./RutrackerAdapter"
import {ITorrentTrackerSearchResult, TorrentTrackerId, TorrentTrackerType, ITorrentTrackerAdapter, ITorrent } from "./Interfaces";
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

	async download(torrentTrackerId: TorrentTrackerId): Promise<ITorrent> {
		if (!this.trackers.has(torrentTrackerId.type)) {
			throw `Unsupported torrent tracker type ${torrentTrackerId.type}`;
		}
		
		var tracker = this.trackers.get(torrentTrackerId.type);
		return await tracker.download(torrentTrackerId.id);
	}

	async search(query: string): Promise<ITorrentTrackerSearchResult[]> {
		var res: ITorrentTrackerSearchResult[] = [];
		for(let tracker of this.trackers.values())
		{
			var results = await this.searchInTracker(tracker, query);
			console.log(`found ${results.length} torrents on tracker ${tracker.Key}`)
			res = [...res, ...results];
		}

		return this.applyFilters(res);
	}	

	private async searchInTracker(tracker: ITorrentTrackerAdapter, query: string): Promise<ITorrentTrackerSearchResult[]>
	{
		try
		{
			return await tracker.search(query);
		}
		catch(e)
		{
			console.log(`Error occured on search request with query ${query} on tracker ${tracker.Key}. Details: ${e}`)
			return [];
		}
	}

	private applyFilters(results: ITorrentTrackerSearchResult[]): ITorrentTrackerSearchResult[]
	{
		var res = results.filter(x => x.seeds >= 1);
		console.log(`left ${res.length} torrents after filtration by seeds`);

		var res = this.applyFilterIfNotEmptyResult(results, x => x.sizeGb <= 25 && x.sizeGb >= 7);
		console.log(`left ${res.length} torrents after filtration by size`);
		
		res = this.applyFilterIfNotEmptyResult(res, x => x.isHD);
		console.log(`left ${res.length} torrents after filtration by category HD Video`);
		
		return res.sort((a, b) => b.sizeGb - a.sizeGb).slice(0, 8);
		
	}

	private applyFilterIfNotEmptyResult<T>(arr: T[],
		predicate: (value: T) => boolean): T[] {
		const filteredResults = arr.filter(predicate);
		return filteredResults.length === 0 ? arr : filteredResults;
	}
}