import {GoogleApis} from "googleapis"
import { IGoogleSearchOnKinopoiskSettings } from "./../Config"

export class GoogleSearchOnKinopoiskWrapper {
  private options: IGoogleSearchOnKinopoiskSettings;

  private google: GoogleApis;

  constructor(options: IGoogleSearchOnKinopoiskSettings) { 
    this.options = options;
    this.google = new GoogleApis();
  }

  async getMovieInfoById(kinopoiskId: number): Promise<IMovieInfo> {
    try {
      return await this.getFilmInfoFromGoogle(kinopoiskId);
    } catch (e) {
      console.error(`Unable to get movie ${kinopoiskId} info from google.`, e);
      return null;
    }
  }  

  private async getFilmInfoFromGoogle(kinopoiskId: number): Promise<IMovieInfo> {
    var resp = await this.google.customsearch("v1").cse.list({         
      cx: this.options.customSearchId, 
      q: kinopoiskId.toString(), 
      auth: this.options.apiKey });

    if(resp == null)
    {
      console.log('No results found in google search');
      return null;
    }

    var item = resp.data.items.find(x => isFilmPage(x, kinopoiskId));
    if (item) {
      let regexp = /сериал, (\d*) сезон/m
      let regRes = regexp.exec(item.title);
      let result: IMovieInfo = {
        title: item.pagemap.movie[0].name,
        alternativeTitle: item.pagemap.movie[0].alternativeheadline,
        year: new Date(item.pagemap.movie[0].datecreated).getFullYear(),
        isTvShow: regRes != null,
        countOfSeasons: regRes ? parseInt(regRes[1]) : null
      }
      return result;
    }
    else {
      console.log('No results found in google search');
      return null;
    }      
  }

}

function isFilmPage(element, kinopoiskId: number) {
  var regexp = /^https:\/\/www.kinopoisk.ru\/film\/[\w\d-]*\/$/m;
  var isFilmPage = regexp.test(element.link);

  return isFilmPage && element.link.endsWith(kinopoiskId + '/');
}

export interface IMovieInfo {
  title: string,
  alternativeTitle: string,
  year: number,
  isTvShow: boolean,
  countOfSeasons: number
}