
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
	// in GB
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

export interface ITorrentTrackerAdapter
{
	readonly Key: TorrentTrackerType;

	isRus() : boolean;

	download(id: ITorrentInfo): Promise<ITorrentDownloadInfo>;

	search(query: string): Promise<ITorrentTrackerSearchResult[]>;
} 