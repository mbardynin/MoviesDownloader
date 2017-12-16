import { servicesReporitory } from "./ServiceLocator"
export class TorrentStatusManager {
	private activeTorrents: { torrentHash: string; chatId: number; messageId: number }[] = [];
	private timeout;
	private pollingIntervalMs = 1 * 60 * 1000;

	addActiveTorrent(torrentHash: string, chatId: number, messageId: number) {
		this.activeTorrents.push({ torrentHash: torrentHash, chatId: chatId, messageId: messageId });
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
			const activeTorrent = self.activeTorrents[activeTorrentIndex];
			if (status !== "SEED_WAIT" && status !== "SEED") {
				// downloading is in progress. Report status.
				const message = `[${status} - <b>${torrent.percentDone * 100}%</b> - ${torrent.peersConnected} peers] Started downloading of torrent <i>'${torrent.name}'</i>.`;
				servicesReporitory.telegramBot.editMessage(activeTorrent.chatId, activeTorrent.messageId, message);
				continue;
			}

			// send message
			servicesReporitory.telegramBot.deleteMessage(activeTorrent.chatId, activeTorrent.messageId);
			servicesReporitory.telegramBot.sendMessageTorrentDownloaded(activeTorrent.chatId, `Download completed. Do you want to <b>delete</b> '${torrent.name}'?`, torrent.hashString);
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