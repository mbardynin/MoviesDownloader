[![Build status](https://mikebard.visualstudio.com/MoviesDownloader/_apis/build/status/MoviesDownloader-CI)](https://mikebard.visualstudio.com/MoviesDownloader/_build/latest?definitionId=1)
![Release status](https://mikebard.vsrm.visualstudio.com/_apis/public/Release/badge/2139a2ed-69ff-42d6-938c-3b9dab75a17d/1/1)

# MoviesDownloader.Service

Web service and telegram bot, which integrates Kinopoisk, torrent trackers (so far Rutracker) and Transmission.
Workflow for bot:
1. Share link to movie on kinopoisk with bot
2. Bot will return appropriate torrents found on torrent trackers
3. Select the most suitable option, torrent will be sent to transmission and downloading will be started immediately.
4. When downloading will be completed, bot will send message about it.

call **tsc** for compile Typescript files.

wait for fix in rutracker-api:
https://github.com/nikityy/rutracker-api/pull/14/commits/d9d856fd199701aac09a9a2b06ff94d0c69902ad