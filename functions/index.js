const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

exports.api = onRequest({ region: "europe-west1" }, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.set("Access-Control-Max-Age", "3600");
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const { type, prompt } = req.body;
        const apiKey = process.env.GEMINI_KEY;

        // YENİ LOG SATIRI: Hangi anahtarı kullandığımızı görelim.
        logger.info(`Kullanılan API Anahtarının başlangıcı: ${apiKey ? apiKey.substring(0, 8) : 'BULUNAMADI'}`);

        if (!apiKey) {
            logger.error("Sunucu yapılandırma hatası: GEMINI_KEY ortam değişkeni eksik.");
            throw new Error("Sunucu yapılandırma hatası: API anahtarı eksik.");
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            logger.error('Google API Hatası:', errorBody);
            res.status(apiResponse.status).json({ error: "Google API isteği başarısız" });
            return;
        }

        const data = await apiResponse.json();
        res.status(200).json(data);

    } catch (error) {
        logger.error('Sunucu Hatası:', error);
        res.status(500).json({ error: error.message });
    }
});