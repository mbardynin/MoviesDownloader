
export enum TorrentTrackerType {
	Rutracker = 1,
	ThePirateBay = 2,
	Rarbg = 3
}

export interface ITorrentTrackerSearchResult {
	id: ITorrentInfo;
	state: string,
	category: string,
	isHD: boolean
	title: string,
	sizeGb: number,
	seeds: number,
	url: string;
}

export interface ITorrentDownloadInfo {
	torrentFileContentBase64?: string | null,
	magnetLink?: string
}

export interface ITorrentInfo {
	readonly type: TorrentTrackerType;
	readonly id?: number;
	readonly magnetLink?: string
}

export class MovieSearchInfo {
	title: string;
	year: number;
	isTvShow: boolean;
	selectedSeason?: number | null;

	toString(seasonStr: string) : string
	{
		let baseStr = `${this.title} ${this.year}`;
		if(this.isTvShow && this.selectedSeason)
			return `${baseStr} ${seasonStr} ${this.selectedSeason}`;
		else
			return baseStr;
	}
}

export interface ITorrentTrackerAdapter
{
	readonly Key: TorrentTrackerType;

	isRus() : boolean;

	download(id: ITorrentInfo): Promise<ITorrentDownloadInfo>;

	search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]>;
} 