var PirateBay = require("thepiratebay");
var filesizeParser = require("filesize-parser");
import {ITorrentTrackerSearchResult, TorrentTrackerType, ITorrentInfo, ITorrentDownloadInfo, ITorrentTrackerAdapter, MovieSearchInfo } from "./Interfaces";

export class ThePirateBayAdapter implements ITorrentTrackerAdapter {
	readonly Key: TorrentTrackerType = TorrentTrackerType.ThePirateBay;

	isRus() : boolean{ return false; }

	async download(id: ITorrentInfo): Promise<ITorrentDownloadInfo> {
		return {
			magnetLink: id.magnetLink
		}
	}

	// 200 - video
	//     201 - Movies
	//     207 - HD - Movies
	async search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]> {	
		var searchOptions = {
			category: 'video',
			orderBy: 'size',
			filter: {
			  verified: true
			}
		  };	
		var torrents: Array<any> = await PirateBay.search(searchInfo.toString("S"), searchOptions);		
		return torrents
			.filter(x => x.subcategory.id == 201 || x.subcategory.id == 207) // moview and HD - movies
			.map( (x) => {
				return {
					id: {type:TorrentTrackerType.ThePirateBay, id: x.id, magnetLink: x.magnetLink},
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