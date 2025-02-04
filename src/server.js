const express = require("express");
const twilio = require("twilio");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const accountSid = "AC7a4c51849c83348a36f2d368974fded7";
const authToken = "3ab74400af4abb5f6cb1763a15d75dbb";
const client = twilio(accountSid, authToken);

app.post("/send-sms", (req, res) => {
    const { message, recipient } = req.body;

    client.messages
        .create({
            body: message,
            from: "+your_twilio_number", // Replace with your Twilio number
            to: recipient,
        })
        .then(() => res.status(200).send("Message sent"))
        .catch(err => res.status(500).send(err.message));
});

app.post("/make-call", (req, res) => {
    const { recipient } = req.body;

    client.calls
        .create({
            url: "http://demo.twilio.com/docs/voice.xml", // Use your own XML for custom messages
            to: recipient,
            from: "+your_twilio_number", // Replace with your Twilio number
        })
        .then(() => res.status(200).send("Call initiated"))
        .catch(err => res.status(500).send(err.message));
});

app.listen(3001, () => console.log("Server running on port 3001"));
