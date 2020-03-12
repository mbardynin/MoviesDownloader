var google = require('googleapis');
var customsearch = google.customsearch("v1");

import { IGoogleSearchOnKinopoiskSettings } from "./../Config"

export class GoogleSearchOnKinopoiskWrapper {
  private options: IGoogleSearchOnKinopoiskSettings;

  constructor(options: IGoogleSearchOnKinopoiskSettings) { this.options = options; }

  async getMovieInfoById(kinopoiskId: number): Promise<IMovieInfo> {
    try {
      return await this.getFilmInfoFromGetmovie(kinopoiskId);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  private async getFilmInfoFromGetmovie(kinopoiskId: number): Promise<IMovieInfo> {
    return new Promise<IMovieInfo>((resolve, reject) => {
      customsearch.cse.list({ cx: this.options.customSearchId, q: kinopoiskId, auth: this.options.apiKey }, function (err, resp) {
        if (err) {
          reject(err);
          return;
        }

        if(resp == null)
        {
          console.log('No results found in google search');
          resolve(null);
          return;
        }

        var item = resp.items.find(x => isFilmPage(x, kinopoiskId));
        if (item) {
          let regexp = /\(\d*, сериал, (\d*) сезонов\)/m
          let regRes = regexp.exec(item.title);
          let result: IMovieInfo = {
            title: item.pagemap.movie[0].name,
            alternativeTitle: item.pagemap.movie[0].alternativeheadline,
            year: new Date(item.pagemap.movie[0].datecreated).getFullYear(),
            isTvShow: regRes != null,
            countOfSeasons: regRes ? parseInt(regRes[1]) : null
          }
          resolve(result);
        }
        else {
          console.log('No results found in google search');
          resolve(null);
        }
      });
    });
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