const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

const TARGET_URL = "https://in.bookmyshow.com/events/travis-scott-circus-maximus-stadium-tour-india/ET00439284"; // Replace with the actual event page URL

const ticketKeywords = [
  "buy now", "book now", "book tickets", "buy tickets", "get tickets"
];

// ✅ Corrected `checkTickets` function
async function checkTickets() {
  try {
    const { data } = await axios.get(TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
      },
    });

    const $ = cheerio.load(data);
    const pageText = $("body").text().toLowerCase();

    const found = ticketKeywords.some(keyword => pageText.includes(keyword));

return { available: true }; // ✅ Fake ticket drop for testing
  } catch (error) {
    console.error("❌ Scraping failed:", error.response ? error.response.status : error.message);
    return { available: false };
  }
}

// ✅ Root route (confirms backend is running)
app.get("/", (req, res) => {
    res.send("Backend is live! Use /check-tickets to check availability.");
});

// ✅ Ticket checking route
app.get("/check-tickets", async (req, res) => {
  const result = await checkTickets();
  res.json(result);
});

// ✅ Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));