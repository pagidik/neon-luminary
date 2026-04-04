import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, summary, whyItMatters } = req.body;
  if (!title || !summary) return res.status(400).json({ error: "bad_input" });

  const plainScript = `${title}.\n\n${summary}\n\nHere's why it matters: ${whyItMatters}`;

  /* ── Path 1: ElevenLabs (if API key is set) ── */
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "iP95p4xoKVk53GoZ742B";
      const resp = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: { "xi-api-key": elevenKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            text: plainScript,
            model_id: "eleven_turbo_v2_5",
            voice_settings: {
              stability: 0.4,
              similarity_boost: 0.75,
              style: 0.6,
              use_speaker_boost: true,
            },
          }),
        }
      );
      if (resp.ok) {
        res.setHeader("Content-Type", "audio/mpeg");
        res.setHeader("Cache-Control", "public, max-age=86400");
        const reader = resp.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        return res.end();
      }
    } catch {}
    /* ElevenLabs failed — fall through to Edge TTS */
  }

  /* ── Path 2: Microsoft Edge TTS (free, neural, no key needed) ── */
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      "en-US-AndrewMultilingualNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
    );

    /* Build SSML for news-style delivery with prosody control */
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
        <voice name="en-US-AndrewMultilingualNeural">
          <mstts:express-as style="newscast-formal" styledegree="1.5">
            <prosody rate="-5%" pitch="+8%">
              ${escXml(title)}.
            </prosody>
            <break time="450ms"/>
            <prosody rate="+0%" pitch="+2%">
              ${escXml(summary)}
            </prosody>
            <break time="500ms"/>
            <prosody rate="-5%" pitch="+6%">
              Here's why it matters. ${escXml(whyItMatters)}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>`;

    const readable = tts.toStream(ssml);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");

    await new Promise((resolve, reject) => {
      readable.on("data", (chunk) => {
        if (chunk.audio) res.write(chunk.audio);
      });
      readable.on("end", resolve);
      readable.on("error", reject);
    });
    return res.end();
  } catch (err) {
    return res.status(500).json({ error: "tts_failed", detail: err.message });
  }
}

function escXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
