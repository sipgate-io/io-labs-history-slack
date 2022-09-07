const { createHistoryModule, sipgateIO } = require('sipgateio');
const { HistoryEntryType } = require('sipgateio/dist/history');
const axios = require('axios');

require("dotenv").config();

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
if (!slackWebhookUrl) {
	console.error(
		'Please provide a Slack webhook URL via the environment variable SLACK_WEBHOOK_URL'
	);
	return;
}

const sipgateio = sipgateIO({
	tokenId: process.env.SIPGATE_TOKEN_ID,
	token: process.env.SIPGATE_TOKEN,
});

const historyModule = createHistoryModule(sipgateio);

const handleEntries = (entries) => {
	entries.forEach((entry) => {
		if (entry.type === HistoryEntryType.SMS) {
			axios.post(slackWebhookUrl, {
				text: `SMS received from ${entry.source}:\n${entry.smsContent}`,
			});
		}
		if (entry.type === HistoryEntryType.VOICEMAIL) {
			axios.post(slackWebhookUrl, {
				text: `New voicemail recording from ${entry.source}:\n${entry.recordingUrl}`,
			});
		}
	});

	historyModule.batchUpdateEvents(entries, () => {
		return { archived: true };
	});
};

setInterval(async () => {
	historyModule
		.fetchAll({
			types: [HistoryEntryType.SMS, HistoryEntryType.VOICEMAIL],
			archived: false,
			directions: ['INCOMING'],
		})
		.then(handleEntries)
		.catch(console.error);
}, 5000);
