
export enum TorrentTrackerType {
	Rutracker = 1,
	ThePirateBay = 2
}

//export interface IRutrackerSearchResult {
//	//state: 'проверено',
//	//id: 'XXXXXXXX'
//	//category: 'CATEGORY_NAME',
//	//title: 'TITLE',
//	//author: 'AUTHOR_NAME',
//	//size: '1.07 GB',
//	//seeds: '7123',
//	//leechs: '275',
//	//url: 'rutracker.org/forum/viewtopic.php?t=XXXXXX'
//	state: string,
//	id: number;
//	category: string,
//	title: string,
//	// in GB
//	sizeGb: number,
//	seeds: number,
//	url: string;
//}
export interface ITorrentTrackerSearchResult {
	//state: 'проверено',
	//id: 'XXXXXXXX'
	//category: 'CATEGORY_NAME',
	//title: 'TITLE',
	//author: 'AUTHOR_NAME',
	//size: '1.07 GB',
	//seeds: '7123',
	//leechs: '275',
	//url: 'rutracker.org/forum/viewtopic.php?t=XXXXXX'
	id: TorrentTrackerId;
	state: string,
	category: string,
	isHD: boolean
	title: string,
	// in GB
	sizeGb: number,
	seeds: number,
	url: string;

}

export interface ITorrent {
	torrentFileContentBase64?: string | null,
	magnetLink?: string
}

export class TorrentTrackerId {
	readonly type: TorrentTrackerType;
	readonly id: number;

	private constructor(type: TorrentTrackerType, id: number) {
		this.type = type;
		this.id = id;
	}

	static create(type: TorrentTrackerType, id: number): TorrentTrackerId {
		return new TorrentTrackerId(type, id);
	}

	// format: kinopoisk_123546
	static parseFromString(str: string): TorrentTrackerId {
		const match = str.match(/([\w]+)_([\d]+)/);
		if (!match) {
			throw new Error(`String '${str}' can not be parsed to TorrentTrackerId`);
		}

		return new TorrentTrackerId(TorrentTrackerType[match[1]], Number(match[2]));
	}

	toString() : string {
		return `${TorrentTrackerType[this.type]}_${this.id}`;
	}
}

export interface ITorrentTrackerAdapter
{
	Key: TorrentTrackerType;

	download(id: number): Promise<ITorrent>;

	search(query: string): Promise<ITorrentTrackerSearchResult[]>;
} 