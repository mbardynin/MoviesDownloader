import { servicesReporitory } from "./ServiceLocator"
export class TorrentStatusManager {
	private activeTorrents: { torrentHash: string; chatId: number }[] = [];
	private timeout;
	private pollingIntervalMs = 1 * 60 * 1000;

	addActiveTorrent(torrentHash: string, chatId: number) {
		this.activeTorrents.push({ torrentHash: torrentHash, chatId: chatId });
		this.startPollingIfNeed();
	}

	private async checkTorrents(self: TorrentStatusManager) {
		const torrentsInfos = await servicesReporitory.transmissionClient.get();
		console.info(`TorrentStatusManager: got info about ${torrentsInfos.torrents.length} torrents.`);
		for (let torrent of torrentsInfos.torrents) {
			const activeTorrentIndex = self.activeTorrents.findIndex(x => x.torrentHash == torrent.hashString);
			if (activeTorrentIndex === -1) {
				continue;
			}

			const status = servicesReporitory.transmissionClient.statusArray[torrent.status];
			if (status !== "SEED_WAIT" && status !== "SEED") {
				continue;
			}

			const activeTorrent = self.activeTorrents[activeTorrentIndex];
			// send message
			servicesReporitory.telegramBot.sendMessage(activeTorrent.chatId, `<b>Completed downloading</b> of torrent <i>'${torrent.name}'</i>.`);
			servicesReporitory.telegramBot.sendMessageTorrentDownloaded(activeTorrent.chatId, `Do you want to <b>delete</b> '${torrent.name}'?`, torrent.hashString);
			// remove from list
			self.activeTorrents.splice(activeTorrentIndex, 1);
		}

		if (self.activeTorrents.length === 0) {
			self.stopPolling();
		}
	}

	private startPollingIfNeed()
	{
		if (this.timeout == null) {
			this.timeout = setInterval(this.checkTorrents, this.pollingIntervalMs, this);
			console.info("Started polling of active torrents.");
		}
	}

	private stopPolling() {
		clearInterval(this.timeout);
		this.timeout = null;
		console.info("Stopped polling of active torrents.");
	}
}