import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountSid = "YOUR_TWILIO_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";

const client = twilio(accountSid, authToken);

// Your numbers
const DISPATCH_NUMBER = "+12054243200"; // your phone
const TWILIO_NUMBER = "+1XXXXXXXXXX"; // your Twilio number

// In-memory queue (upgrade later to DB)
let queue = [];

app.post("/dispatch", async (req, res) => {
    const { name, phone, location, gps, service, details } = req.body;

    const job = {
        name,
        phone,
        location,
        gps,
        service,
        details,
        priority: service === "Recovery" ? 1 : 2,
        time: Date.now()
    };

    queue.push(job);
    queue.sort((a,b) => a.priority - b.priority || a.time - b.time);

    try {
        // SMS TO YOU
        await client.messages.create({
            body:
`🚨 NEW JOB
Service: ${service}
Name: ${name}
Phone: ${phone}
Location: ${location}
GPS: ${gps || "N/A"}`,
            from: TWILIO_NUMBER,
            to: DISPATCH_NUMBER
        });

        // SMS TO CUSTOMER
        await client.messages.create({
            body: "Wheeler Wrecker is dispatching a driver now. We’re on the way.",
            from: TWILIO_NUMBER,
            to: phone
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "SMS failed" });
    }
});

app.get("/queue", (req, res) => {
    res.json(queue);
});

app.listen(3000, () => console.log("Server running on port 3000"));
