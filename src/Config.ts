export interface Config {
	transmissionSettings: ITransmissionSettings;
    torrentTrackerSettings: ITorrentTrackersManagerSettings;
	kinopoiskSettings: IKinopoiskWrapperSettings;
	googleSearchOnSettings: IGoogleSearchOnKinopoiskSettings;
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
}

export interface IGoogleSearchOnKinopoiskSettings {
	apiKey: ILoginPassword;
	customSearchId: string;
}

export interface ITelegramBotSettings {
	token: string;
	allowedChats: number[];
	useWebHooks: boolean;
	webHooksBaseUrl: string;
	useProxy: boolean;
}

export interface ITransmissionSettings {
	host: string,
	username: string,
	password: string,
	ssl: boolean,
	port: number;
}