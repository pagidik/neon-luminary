import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, summary, whyItMatters } = req.body;
  if (!title || !summary) return res.status(400).json({ error: "bad_input" });

  const plainScript = `${title}.\n\n${summary}\n\nKey takeaway. ${whyItMatters}`;

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
        const buf = Buffer.from(await resp.arrayBuffer());
        return res.send(buf);
      }
    } catch {}
  }

  /* ── Path 2: Microsoft Edge TTS (free, neural, no key needed) ── */
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata("en-US-DavisNeural", OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(plainScript, {
      rate: "-8%",
      pitch: "-2Hz",
      volume: "+0%",
    });

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => chunks.push(chunk));
      audioStream.on("end", resolve);
      audioStream.on("close", resolve);
      audioStream.on("error", reject);
    });

    const buf = Buffer.concat(chunks);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buf);
  } catch (err) {
    return res.status(500).json({ error: "tts_failed", detail: String(err) });
  }
}
