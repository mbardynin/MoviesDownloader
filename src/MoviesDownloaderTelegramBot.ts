import Telegraf, {ContextMessageUpdate, Extra, Markup, Buttons, CallbackButton } from "telegraf"
import { ExtraEditMessage } from "telegraf/typings/telegram-types";
import { servicesReporitory } from "./ServiceLocator"
import { ITelegramBotSettings } from "./Config";
import { ITorrentTrackerSearchResult, TorrentTrackerType, ITorrentInfo } from "./Trackers/Interfaces";
import SocksAgent from 'socks5-https-client/lib/Agent';
import { Guid } from "guid-typescript";

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
		// this.bot.use(Telegraf.log())
		

		this.bot.command('hi', (ctx) => {
			ctx.reply("Hi!")
		});

		this.bot.command('getChatId', (ctx) => {
			const chatId = ctx.chat.id;
			ctx.reply(chatId.toString())
		});

		this.bot.hears(/http[s]*:\/\/www.kinopoisk.ru\/film\/(\d+)/, 
			async (ctx) => await this.processMovie(ctx, self));

		this.bot.hears(/http[s]*:\/\/www.kinopoisk.ru\/film\/[\w\d-]*-(\d+)/, 
			async (ctx) => await this.processMovie(ctx, self));

		this.bot.action(/^\d+\|/, async ctx => {
			try
			{
				const callbackData = CallbackData.parse(ctx.callbackQuery.data);
				const msg = ctx.callbackQuery.message;
				const chatId = msg.chat.id;
				switch (callbackData.action) {
					case BotCallbackActions.Cancel:
						this.cancelCalback(ctx.callbackQuery.id, chatId, msg);
						return;
					case BotCallbackActions.Download:
						await this.downloadCalback(ctx.callbackQuery.id, chatId, msg, callbackData.data as ITorrentInfo);
						return;
					case BotCallbackActions.RemoveTorrent:
						await this.removeTorrentCalback(ctx.callbackQuery.id, chatId, msg, callbackData.data);
						return;
					default:
						console.warn(`Unknown callback action registered: '${callbackData.toString()}'`);
				}
			}
			catch(e){
				console.error(`Error occured on handling callback ${ctx.callbackQuery.data}. Details: ${e}`);
				ctx.answerCbQuery(e);
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
			const trackerResults = await servicesReporitory.moviesDownloaderService.GetApplicableTorrents(filmId);
			if (trackerResults.length === 0) {
				ctx.reply("Appropriate torrents on torrent trackers don't found.");
				return;
			}

			const message = this.createDownloadMessage(trackerResults);
			const keyboard = this.createDownloadMessageKeyboard(trackerResults);
			const opts = this.createSendMessageOptions(keyboard);
			ctx.reply(message, opts);
			
		} catch (e) {
			ctx.reply(`Unable to find appropriate torrents. Reason: ${e.message}`);
		} 
	}
	
	private cancelCalback(callbackId, chatId, message) {
		this.editMessage(chatId, message.message_id, "Action is canceled.")
	}

	private async downloadCalback(callbackId, chatId, message, torrentInfo: ITorrentInfo) {
		try {
			const addTorrentResult = await servicesReporitory.moviesDownloaderService.AddTorrent(torrentInfo);

			this.editMessage(chatId, message.message_id, `Started Downloading of torrent '${addTorrentResult.name}'.`)
			await servicesReporitory.torrentStatusManager.addActiveTorrent(addTorrentResult.hashString, chatId, message.message_id);
		} catch (e) {
			this.editMessage(chatId, message.message_id, `Unable to download torrent ${torrentInfo}. Reason: ${e.message}`)
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
			message += `\r\n\r\n [${TorrentTrackerType[x.id.type]}] [<b>${x.sizeGb}GB</b>] [${x.state}] [seeds:<i>${x.seeds}</i>] [<i>${x.category}</i>] - <b>${x.title}</b> <a href="${x.url}">link ${x.id.id}</a>`;
		}

		return message;
	}

	private createDownloadMessageKeyboard(rutrackerResults: ITorrentTrackerSearchResult[]) : Buttons[][] {
		return rutrackerResults.map(x => this.createKeyboardButton(`${TorrentTrackerType[x.id.type]} [${x.sizeGb}GB]`, CallbackData.create(BotCallbackActions.Download, x.id)));
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
	readonly data: any;
	static readonly cache: Map<string, string> = new Map<string, string>();

	private constructor(action: BotCallbackActions, data: any) {
		this.action = action;
		this.data = data;
	}

	toString() {
		// callback data has to be 1-64 bytes long (limitation of Telegram API).
		// As a simple workaround I use in-memory cache of data with Guid key.
		var cacheKey = Guid.raw();
		CallbackData.cache.set(cacheKey, this.data);
		console.log(`[${cacheKey}] - ${JSON.stringify(this.data)}`);
		return `${this.action}|${cacheKey}`;
	}

	static parse(callbackData: string): CallbackData {
		const indexOfSplitter = callbackData.indexOf("|");
		if (indexOfSplitter == -1) {
			throw new Error(`Callback data has incorrect format. Expected '{actionType(0)}|{data}', Actual: '${callbackData}'`);
		}

		const action: BotCallbackActions = Number(callbackData.substr(0, indexOfSplitter));
		var cacheKey = callbackData.substr(indexOfSplitter + 1);
		
		var data = null;
		if(CallbackData.cache.has(cacheKey))
		{
			data = CallbackData.cache.get(cacheKey);
		}
		else
		{
			console.error(`unable to get data from cache with given key ${cacheKey}`);
		}

		return new CallbackData(action, data);
	}

	static create(action: BotCallbackActions, data: any = ""): CallbackData {
		return new CallbackData(action, data);
	}
}

enum BotCallbackActions {
	Cancel = 0,
	Download = 1,
	RemoveTorrent = 2
}
