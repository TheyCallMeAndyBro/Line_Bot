require('dotenv').config()

const express = require('express')
const app = express()
const line = require('@line/bot-sdk');

const port = process.env.PORT || 3000;

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);


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

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: event.message.text,
    max_token: 100,
  });

  // create a echoing text message
  const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
