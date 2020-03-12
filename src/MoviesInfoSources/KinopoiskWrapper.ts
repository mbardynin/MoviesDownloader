import { getById as kinopoiskGetFilmById } from "./kinopoisk"
import { IKinopoiskWrapperSettings } from "./../Config"
import { servicesReporitory } from "./../ServiceLocator"

export class KinopoiskWrapper {
	private options: IKinopoiskWrapperSettings;

	constructor(options: IKinopoiskWrapperSettings) { this.options = options; }

	async getById(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		try {
			var movieInfo = await servicesReporitory.googleSearchOnKinopoisk.getMovieInfoById(kinopoiskId);
			
			if(!movieInfo){
				console.log('Fall back to kinopoisk search.');
				return await this.getByIdFromKinopoisk(kinopoiskId);
			}

			let mappedFilmInfo: IKinopoiskMovieInfo = {
				title: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(movieInfo.alternativeTitle) ? movieInfo.alternativeTitle : movieInfo.title,
				year: movieInfo.year,
				director: "",
				isTvShow: movieInfo.isTvShow,
				countOfSeasons: movieInfo.countOfSeasons
				//director: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(film.director[0]) ? film.director[0] : ""
			};
			return mappedFilmInfo;
		} catch (e) {
			console.error(e);
			return await this.getByIdFromKinopoisk(kinopoiskId);
		} 
	}

	private async getByIdFromKinopoisk(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		return new Promise<IKinopoiskMovieInfo>((resolve, reject) => {
			kinopoiskGetFilmById(kinopoiskId, this.GetOptions(),  (err, film) => {
				if (err) {
					reject(err);
				} else {
					let mappedFilmInfo: IKinopoiskMovieInfo = {
						title: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(film.alternativeTitle) ? film.alternativeTitle : film.title,
						year: film.year,
						director: "",
						isTvShow: false,
						countOfSeasons: NaN
						//director: this.isStringNotEmptyAndHasJustLatinAndCyrilicChars(film.director[0]) ? film.director[0] : ""
					}
					resolve(mappedFilmInfo);					
				}
			});
		});
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
	director: string,
	isTvShow: boolean,
	countOfSeasons: number
}