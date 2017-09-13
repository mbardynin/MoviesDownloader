import { getById as kinopoiskGetFilmById } from "./kinopoisk"
let request = require("request-promise-native");
import { IKinopoiskWrapperSettings } from "./../Config"

export class KinopoiskWrapper {
	private options: IKinopoiskWrapperSettings;

	constructor(options: IKinopoiskWrapperSettings) { this.options = options; }

	async getById(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		try {
			return await this.getFilmInfoFromGetmovie(kinopoiskId);
		} catch (e) {
			console.error(e);
			return await this.getByIdFromKinopoisk(kinopoiskId);
		} 
	}

	async getByIdFromKinopoisk(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		return new Promise<IKinopoiskMovieInfo>((resolve, reject) => {
			kinopoiskGetFilmById(kinopoiskId, this.GetOptions(),  (err, film) => {
				if (err) {
					reject(err);
				} else {
					let mappedFilmInfo: IKinopoiskMovieInfo = {
						title: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(film.alternativeTitle) ? film.alternativeTitle : film.title,
						year: film.year,
						director: ""
						//director: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(film.director[0]) ? film.director[0] : ""
					}
					resolve(mappedFilmInfo);					
				}
			});
		});
	}

	private async getFilmInfoFromGetmovie(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		// docs: http://getmovie.cc/api-kinopoisk.html
		const options = {
			uri: 'http://getmovie.cc/api/kinopoisk.json',
			qs: {
				id: kinopoiskId,
				token: this.options.getmovieCcApiKey // -> uri + '?token=xxxxx%20xxxxx' 
			},
			json: true // Automatically parses the JSON string in the response 
		};

		const res = await request(options);

		console.info(`Film info ${kinopoiskId} loaded from getmovie.cc`);
		return {
			title: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(res.name_en) ? res.name_en : res.name_ru,
			year: res.year,
			director: ""
			//director: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(res.creators.director[0].name_person_en) ? res.creators.director[0].name_person_en : res.creators.director[0].name_person_ru
		};
	}

	private isStringNotEmptyAndHasJustLatinAndCyrilicChars(str: string): boolean {
		if (!str)
			return false;

		return /^[\u0000-\u007F\u0400-\u04FF\d\s]+$/.test(str);
	}

	private GetOptions(): any {
		return  {
		title: true,
		alternativeTitle: true,
		year: true,
		director: true
		}
	};
}

export interface IKinopoiskMovieInfo {
	title: string,
	year: number,
	director: string;
}