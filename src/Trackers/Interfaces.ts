
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

	toString(seasonStr: string, seasonDigits : number = 1) : string
	{
		let baseStr = `${this.title} ${this.year}`;
		if(this.isTvShow && this.selectedSeason)
		{
			var season = this.zeroPad(this.selectedSeason, seasonDigits);
			return `${baseStr} ${seasonStr}${season}`;
		}
		else
			return baseStr;
	}

	private zeroPad(num : number, places: number) {
		var zero = places - num.toString().length + 1;
		return Array(+(zero > 0 && zero)).join("0") + num;
	  }
}

export interface ITorrentTrackerAdapter
{
	readonly Key: TorrentTrackerType;

	isRus() : boolean;

	download(id: ITorrentInfo): Promise<ITorrentDownloadInfo>;

	search(searchInfo: MovieSearchInfo): Promise<ITorrentTrackerSearchResult[]>;
} 