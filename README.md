# MoviesDownloader.Service

Web service and telegram bot, which integrates Kinopoisk, torrent trackers (so far Rutracker) and Transmission.
Workflow for bot:
1. Share link to movie on kinopoisk with bot
2. Bot will return appropriate torrents found on torrent trackers
3. Select the most suitable option, torrent will be sent to transmission and downloading will be started immediately.
4. When downloading will be completed, bot will send message about it.

call **tsc** for compile Typescript files.