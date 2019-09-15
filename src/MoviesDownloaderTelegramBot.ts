import Telegraf, {ContextMessageUpdate, Extra, Markup, Buttons, CallbackButton } from "telegraf"
import { ExtraEditMessage } from "telegraf/typings/telegram-types";
import { servicesReporitory } from "./ServiceLocator"
import { ITelegramBotSettings } from "./Config";
import { ITorrentTrackerSearchResult, TorrentTrackerType } from "./Trackers/Interfaces";
import SocksAgent from 'socks5-https-client/lib/Agent';

export class MoviesDownloaderTelegramBot {
	private readonly options: ITelegramBotSettings;
	private bot : Telegraf<ContextMessageUpdate>;

	constructor(options: ITelegramBotSettings) {
		this.options = options;
	}

	// WebHook
	// processUpdate(messageBody) {
	// 	this.bot.processUpdate(messageBody);
	// }

	webhookCallback(): any{
		return this.bot.webhookCallback(`/bot${this.options.token}`);
	}

	editMessage(chatId: number, messageId: number, message: string) {
		this.bot.telegram.editMessageText(chatId, messageId, null, message, { parse_mode: "HTML" });
	}

	deleteMessage(chatId: number, messageId: number) {
		this.bot.telegram.deleteMessage(chatId, messageId);
	}

	sendMessageTorrentDownloaded(chatId: number, message: string, torrentHash: string) {
		const keyboard = [
			this.createKeyboardButton("Yes", CallbackData.create(BotCallbackActions.RemoveTorrent, torrentHash))
		];
		const opts = this.createSendMessageOptions(keyboard);
		this.bot.telegram.sendMessage(chatId, message, opts);
	}

	activate() {
		const self = this;

		var socksAgent = null;
		if(this.options.useProxy)
		{
			socksAgent = new SocksAgent({
			socksHost: 'localhost',
			socksPort: 1080,
			});
		}

		this.bot = new Telegraf(this.options.token, {
				telegram: { 
					webhookReply: this.options.useWebHooks,
					agent: socksAgent
				}
			});

		this.bot.telegram.deleteWebhook()
		this.bot.use(Telegraf.log())
		

		this.bot.command('echo', (ctx) => {
			const resp = ctx.match[1];
			ctx.reply(resp)
		});

		this.bot.command('getChatId', (ctx) => {
			const chatId = ctx.chat.id;
			ctx.reply(chatId.toString())
		});

		this.bot.hears(/http[s]*:\/\/www.kinopoisk.ru\/film\/(\d+)/, 
			async (ctx) => await this.processMovie(ctx, self));

		this.bot.hears(/http[s]*:\/\/www.kinopoisk.ru\/film\/[\w\d-]*-(\d+)/, 
			async (ctx) => await this.processMovie(ctx, self));

		this.bot.action(/^(\d+)\|(\w*)$/, async ctx => {
			const callbackData = CallbackData.parse(ctx.callbackQuery.data);
			const msg = ctx.callbackQuery.message;
			const chatId = msg.chat.id;
			switch (callbackData.action) {
				case BotCallbackActions.Cancel:
					this.cancelCalback(ctx.callbackQuery.id, chatId, msg);
					return;
				case BotCallbackActions.Download:
					await this.downloadCalback(ctx.callbackQuery.id, chatId, msg, callbackData.data);
					return;
				case BotCallbackActions.RemoveTorrent:
					await this.removeTorrentCalback(ctx.callbackQuery.id, chatId, msg, callbackData.data);
					return;
				default:
					console.warn(`Unknown callback action registered: '${callbackData.toString()}'`);
			}
		});
		
		this.bot.catch((err) => {
			console.log('Ooops', err)
		})
		
		if (this.options.useWebHooks) 
		{
			// callback routing configured in server.ts
			this.bot.telegram.setWebhook(`${this.options.webHooksBaseUrl}/bot${this.options.token}`, null, 443)
		}
		else
		{
			this.bot.startPolling()
		}

		return console.log(`bot is activated`)
	}

	private async processMovie(ctx: ContextMessageUpdate, self: this) {			
		const chatId = ctx.chat.id;
		// check permissions
		if (!this.isAllowedChat(chatId)) {
			ctx.reply("You have not permissions for downloading movies.");
			return;
		}

		const filmId = Number.parseInt(ctx.match[1]);	
		try {
			const rutrackerResults = await servicesReporitory.moviesDownloaderService.GetApplicableTorrents(filmId);
			if (rutrackerResults.length === 0) {
				ctx.reply("Appropriate torrents on torrent trackers don't found.");
				return;
			}

			const message = this.createDownloadMessage(rutrackerResults);
			const keyboard = this.createDownloadMessageKeyboard(rutrackerResults);
			const opts = this.createSendMessageOptions(keyboard);
			ctx.reply(message, opts);
			
		} catch (e) {
			ctx.reply(`Unable to find appropriate torrents. Reason: ${e.message}`);
		} 
	}
	
	private cancelCalback(callbackId, chatId, message) {
		this.editMessage(chatId, message.message_id, "Action is canceled.")
	}

	private async downloadCalback(callbackId, chatId, message, torrentTrackerId: string) {
		try {
			const addTorrentResult = await servicesReporitory.moviesDownloaderService.AddTorrent(torrentTrackerId);

			this.editMessage(chatId, message.message_id, `Started Downloading of torrent '${addTorrentResult.name}'.`)
			await servicesReporitory.torrentStatusManager.addActiveTorrent(addTorrentResult.hashString, chatId, message.message_id);
		} catch (e) {
			this.editMessage(chatId, message.message_id, `Unable to download torrent ${torrentTrackerId}. Reason: ${e.message}`)
		} 
	}

	private async removeTorrentCalback(callbackId, chatId, message, torrentHash: string) {
		try {
			await servicesReporitory.transmissionClient.remove(torrentHash, true);
			this.editMessage(chatId, message.message_id, "Torrent is removed.")
		} catch (e) {
			this.editMessage(chatId, message.message_id, `Unable to remove torrent with hash ${torrentHash}. Reason: ${e.message}`)
		}
	}

	private createDownloadMessage(rutrackerResults: ITorrentTrackerSearchResult[]): string {
		let message = "Please select torrent for downloading:";
		for (let x of rutrackerResults) {
			message += `\r\n\r\n [${TorrentTrackerType[x.id.type]}] [<b>${x.sizeGb}GB</b>] [${x.state}] [seeds:<i>${x.seeds}</i>] [<i>${x.category}</i>] - <b>${x.title}</b> <a href="${x.url}">${x.id.toString()}</a>`;
		}

		return message;
	}

	private createDownloadMessageKeyboard(rutrackerResults: ITorrentTrackerSearchResult[]) : Buttons[][] {
		return rutrackerResults.map(x => this.createKeyboardButton(`${TorrentTrackerType[x.id.type]} [${x.sizeGb}GB]`, CallbackData.create(BotCallbackActions.Download, x.id.toString())));
	}

	private createKeyboardButton(text: string, callbackData: CallbackData) : CallbackButton[] {
		return [{
				text: text,
				callback_data: callbackData.toString(),
				hide: false
			}];
	}

	private createCancelInlineButton() : Buttons[] {
		return this.createKeyboardButton("Cancel", CallbackData.create(BotCallbackActions.Cancel));
	}

	private createSendMessageOptions(keyboard: Buttons[][] | null = null): ExtraEditMessage {
		var markup = new Markup()
		if (keyboard) {
			keyboard.push(this.createCancelInlineButton());
			markup.inlineKeyboard(keyboard, null);
		}
		
		const opts = this.createOptions(markup);
		return opts;
	}

	private createOptions(reply_markup : Markup | null = null) : ExtraEditMessage {
		return new Extra(null)
			.HTML(true)
			.webPreview(false)
			.markup(reply_markup);
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
