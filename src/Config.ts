export interface Config {
	transmissionSettings: ITransmissionSettings;
    torrentTrackerSettings: ITorrentTrackersManagerSettings;
	kinopoiskSettings: IKinopoiskWrapperSettings;
	telegramBotSettings: ITelegramBotSettings;
	port: number;
	allowedGoogleAccounts: string[];
}

export interface ITorrentTrackersManagerSettings {
    rutrackerSettings: ILoginPassword,
}

export interface ILoginPassword {
	login: string;
	password: string;
}

export interface IKinopoiskWrapperSettings {
	credentials: ILoginPassword;
	getmovieCcApiKey: string;
}

export interface ITelegramBotSettings {
	token: string;
	allowedChats: number[];
}

export interface ITransmissionSettings {
	host: string,
	username: string,
	password: string,
	ssl: boolean,
	port: number;
}