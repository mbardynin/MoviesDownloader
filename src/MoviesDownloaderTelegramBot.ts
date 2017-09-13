﻿var TelegramBot = require("node-telegram-bot-api");
import { servicesReporitory } from "./ServiceLocator"
import { ITelegramBotSettings } from "./Config";
import { ITorrentTrackerSearchResult, TorrentTrackerType } from "./Trackers/Interfaces";

export class MoviesDownloaderTelegramBot {
	private readonly options: ITelegramBotSettings;
	private bot;

	constructor(options: ITelegramBotSettings) {
		this.options = options;
	}

	sendMessage(chatId: number, message: string) {
		this.bot.sendMessage(chatId, message, this.createSendMessageOptions());
	}

	sendMessageTorrentDownloaded(chatId: number, message: string, torrentHash: string) {
		const keyboard = [
			this.createKeyboardButton("Yes", CallbackData.create(BotCallbackActions.RemoveTorrent, torrentHash))
		];
		const opts = this.createSendMessageOptions(keyboard);
		this.bot.sendMessage(chatId, message, opts);
	}

	activate() {
		const self = this;
		this.bot = new TelegramBot(this.options.token, { polling: true });
		this.bot.onText(/\/echo (.+)/, (msg, match) => {
			const chatId = msg.chat.id;
			const resp = match[1];
			this.bot.sendMessage(chatId, resp);
		});

		this.bot.onText(/\/getChatId/, (msg) => {
			const chatId = msg.chat.id;
			this.bot.sendMessage(chatId, chatId);
		});

		this.bot.onText(/http[s]*:\/\/www.kinopoisk.ru\/film\/(\d+)/,
			async (msg, match) => {
				const chatId = msg.chat.id;

				// check permissions
				if (!self.isAllowedChat(chatId)) {
					this.bot.sendMessage(chatId, "You have not permissions for downloading movies.");
					return;
				}

				const filmId = match[1];
				try {
					const rutrackerResults = await servicesReporitory.moviesDownloaderService.GetApplicableTorrents(filmId);
					if (rutrackerResults.length === 0) {
						this.bot.sendMessage(chatId, "Appropriate torrents on torrent trackers don't found.");
						return;
					}

					const message = self.createDownloadMessage(rutrackerResults);
					const keyboard = self.createDownloadMessageKeyboard(rutrackerResults);
					const opts = self.createSendMessageOptions(keyboard);
					this.bot.sendMessage(chatId, message, opts);
					
				} catch (e) {
					this.bot.sendMessage(chatId, `Unable to find appropriate torrents. Reason: ${e.message}`);
				} 
		});
		
		this.bot.on('callback_query', async callbackQuery => {
			const callbackData = CallbackData.parse(callbackQuery.data);
			const msg = callbackQuery.message;
			const chatId = msg.chat.id;
			switch (callbackData.action) {
				case BotCallbackActions.Cancel:
					this.cancelCalback(callbackQuery.id, chatId, msg);
					return;
				case BotCallbackActions.Download:
					await this.downloadCalback(callbackQuery.id, chatId, msg, callbackData.data);
					return;
				case BotCallbackActions.RemoveTorrent:
					await this.removeTorrentCalback(callbackQuery.id, chatId, msg, callbackData.data);
					return;
				default:
					console.warn(`Unknown callback action registered: '${callbackData.toString()}'`);
			}
		});
		
		return console.log(`bot is activated`)
	}
	
	private cancelCalback(callbackId, chatId, message) {
		this.bot.answerCallbackQuery(callbackId, `You canceled action`);
		this.bot.editMessageText("Action is canceled.", { chat_id: chatId, message_id: message.message_id });
	}

	private async downloadCalback(callbackId, chatId, message, torrentTrackerId: string) {
		try {
			const addTorrentResult = await servicesReporitory.moviesDownloaderService.AddTorrent(torrentTrackerId);

			this.bot.answerCallbackQuery(callbackId, `You selected ${torrentTrackerId}`);
			this.bot.editMessageText(`Started Downloading of torrent '${addTorrentResult.name}'.`, { chat_id: chatId, message_id: message.message_id });
			await servicesReporitory.torrentStatusManager.addActiveTorrent(addTorrentResult.hashString, chatId);
		} catch (e) {
			this.bot.answerCallbackQuery(callbackId, `Unable to download torrent ${torrentTrackerId}`);
			this.bot.editMessageText(`Unable to download torrent ${torrentTrackerId}. Reason: ${e.message}`, { chat_id: chatId, message_id: message.message_id });
		} 
	}

	private async removeTorrentCalback(callbackId, chatId, message, torrentHash: string) {
		try {
			await servicesReporitory.transmissionClient.remove(torrentHash, true);
			this.bot.editMessageText(`Torrent removed`, { chat_id: chatId, message_id: message.message_id });
		} catch (e) {
			this.bot.answerCallbackQuery(callbackId, `Unable to remove torrent with hash ${torrentHash}`);
			this.bot.editMessageText(`Unable to remove torrent with hash ${torrentHash}. Reason: ${e.message}`, { chat_id: chatId, message_id: message.message_id });
		}
	}

	private createDownloadMessage(rutrackerResults: ITorrentTrackerSearchResult[]): string {
		let message = "Please select torrent for downloading:";
		for (let x of rutrackerResults) {
			message += `\r\n\r\n [${TorrentTrackerType[x.id.type]}] [<b>${x.sizeGb}GB</b>] [${x.state}] [seeds:<i>${x.seeds}</i>] [<i>${x.category}</i>] - <b>${x.title}</b> <a href="${x.url}">${x.id.toString()}</a>`;
		}

		return message;
	}

	private createDownloadMessageKeyboard(rutrackerResults: ITorrentTrackerSearchResult[]) {
		return rutrackerResults.map(x => this.createKeyboardButton(`${TorrentTrackerType[x.id.type]} [${x.sizeGb}GB]`, CallbackData.create(BotCallbackActions.Download, x.id.toString())));
	}

	private createKeyboardButton(text: string, callbackData: CallbackData) {
		return [
			{
				text: text,
				callback_data: callbackData.toString()
			}
		];
	}

	private createCancelInlineButton() {
		return this.createKeyboardButton("Cancel", CallbackData.create(BotCallbackActions.Cancel));
	}

	private createSendMessageOptions(keyboard = null) {
		if (keyboard) {
			keyboard.push(this.createCancelInlineButton());
		}

		const opts = this.createOptions(keyboard);
		return opts;
	}

	private createOptions(keyboard) {
		return {
			reply_markup: {
				inline_keyboard: keyboard
			},
			disable_web_page_preview: true,
			parse_mode: "HTML"
		};
	}

	private isAllowedChat(id: number): boolean {
		return this.options.allowedChats.indexOf(id) > -1;
	}
}

class CallbackData {
	readonly action: BotCallbackActions;
	readonly data: string;

	private constructor(action: BotCallbackActions, data: string) {
		this.action = action;
		this.data = data;
	}

	toString() {
		return `${this.action}|${this.data}`;
	}

	static parse(callbackData: string): CallbackData {
		const matches = callbackData.match(/^(\d+)\|(\w*)$/);
		if (!matches || matches.length < 3) {
			throw new Error(`Callback data has incorrect format. Expected '{actionType(0)}|{data}', Actual: '${callbackData}'`);
		}

		const action: BotCallbackActions = Number(matches[1]);
		return new CallbackData(action, matches[2]);
	}

	static create(action: BotCallbackActions, data: string = ""): CallbackData {
		return new CallbackData(action, data);
	}
}

enum BotCallbackActions {
	Cancel = 0,
	Download = 1,
	RemoveTorrent = 2
}
