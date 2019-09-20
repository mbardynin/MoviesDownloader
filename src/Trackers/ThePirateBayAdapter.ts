var PirateBay = require("thepiratebay");
var filesizeParser = require("filesize-parser");
import {ITorrentTrackerSearchResult, TorrentTrackerType, TorrentTrackerId, ITorrent, ITorrentTrackerAdapter } from "./Interfaces";

export class ThePirateBayAdapter implements ITorrentTrackerAdapter {
	readonly Key: TorrentTrackerType = TorrentTrackerType.ThePirateBay;
	async download(id: number): Promise<ITorrent> {
		var torrent = await PirateBay.getTorrent(id);
		return {
			magnetLink: torrent.magnetLink
		}
	}

	// 200 - video
	//     201 - Movies
	//     207 - HD - Movies
	async search(query: string): Promise<ITorrentTrackerSearchResult[]> {	
		var searchOptions = {
			category: 'video',
			orderBy: 'size'
		  };	
		var torrents: Array<any> = await PirateBay.search(query, searchOptions);		
		return torrents
			.filter(x => x.subcategory.id == 201 || x.subcategory.id == 207) // moview and HD - movies
			.map( (x) => {
				return {
					id: TorrentTrackerId.create(TorrentTrackerType.ThePirateBay, x.id),
					state: x.verified ? "verified" : "not verified",
					category: x.subcategory.name,
					title: x.name,
					sizeGb: Math.round((filesizeParser(x.size) / (1024 * 1024 * 1024)) * 10) /10,
					seeds: x.seeders,
					url: x.link,
					isHD: x.subcategory.id == 207				
				};
			});
	}
}