import { IKinopoiskWrapperSettings } from "./../Config"
import { servicesReporitory } from "./../ServiceLocator"

export class KinopoiskWrapper {
	private options: IKinopoiskWrapperSettings;

	constructor(options: IKinopoiskWrapperSettings) { this.options = options; }

	async getById(kinopoiskId: number): Promise<IKinopoiskMovieInfo> {
		var movieInfo = await servicesReporitory.googleSearchOnKinopoisk.getMovieInfoById(kinopoiskId);
		
		if(!movieInfo){
			throw `Unable to find movie info with id ${kinopoiskId}`;
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