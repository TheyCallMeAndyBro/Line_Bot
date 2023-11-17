require('dotenv').config()

const express = require('express')
const app = express()
const line = require('@line/bot-sdk');

const port = process.env.PORT || 3000;

const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, });


// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
});


// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/realtalk', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      { "role": "user", "content": event.message.text },
      { "role": "system", "content": "請使用繁體中文回答" }
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 150,
  });

  const choices = chatCompletion.choices[0];
  const answer = { type: 'text', text: choices.message.content.trim() || '抱歉，我沒有話可說了。' };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [answer],
  });
}

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
