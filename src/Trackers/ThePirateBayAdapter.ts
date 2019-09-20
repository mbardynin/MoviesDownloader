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
			category: '/search/0/99/207',    // HD - Movies
			orderBy: 'size'
		  };	
		var torrents = await PirateBay.search(query, searchOptions);		
		return torrents.map( (x) => {
			return {
				id: TorrentTrackerId.create(TorrentTrackerType.ThePirateBay, x.id),
				state: x.verified ? "verified" : "not verified",
				category: x.subcategory.name,
				title: x.name,
				sizeGb: Math.round((filesizeParser(x.size) / (1024 * 1024 * 1024)) * 10) /10,
				seeds: x.seeders,
				url: x.link,
				isHD: true				
			};});
	}
}