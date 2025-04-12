import { md5 } from 'js-md5';
import { randomMd5 } from '@/utils/misc';
import { LRUCache } from '@/utils/lru';
// The base URL for the Edge Speech service, used for WebSocket connections.
const EDGE_SPEECH_URL =
  'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';

// The API token required to authenticate with the Edge Speech service.
const EDGE_API_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
// A comprehensive list of voice IDs supported by the Edge TTS service, categorized by language code.
const EDGE_TTS_VOICES = {
  'af-ZA': ['af-ZA-AdriNeural', 'af-ZA-WillemNeural'],
  'am-ET': ['am-ET-AmehaNeural', 'am-ET-MekdesNeural'],
  'ar-AE': ['ar-AE-FatimaNeural', 'ar-AE-HamdanNeural'],
  'ar-BH': ['ar-BH-AliNeural', 'ar-BH-LailaNeural'],
  'ar-DZ': ['ar-DZ-AminaNeural', 'ar-DZ-IsmaelNeural'],
  'ar-EG': ['ar-EG-SalmaNeural', 'ar-EG-ShakirNeural'],
  'ar-IQ': ['ar-IQ-BasselNeural', 'ar-IQ-RanaNeural'],
  'ar-JO': ['ar-JO-SanaNeural', 'ar-JO-TaimNeural'],
  'ar-KW': ['ar-KW-FahedNeural', 'ar-KW-NouraNeural'],
  'ar-LB': ['ar-LB-LaylaNeural', 'ar-LB-RamiNeural'],
  'ar-LY': ['ar-LY-ImanNeural', 'ar-LY-OmarNeural'],
  'ar-MA': ['ar-MA-JamalNeural', 'ar-MA-MounaNeural'],
  'ar-OM': ['ar-OM-AbdullahNeural', 'ar-OM-AyshaNeural'],
  'ar-QA': ['ar-QA-AmalNeural', 'ar-QA-MoazNeural'],
  'ar-SA': ['ar-SA-HamedNeural', 'ar-SA-ZariyahNeural'],
  'ar-SY': ['ar-SY-AmanyNeural', 'ar-SY-LaithNeural'],
  'ar-TN': ['ar-TN-HediNeural', 'ar-TN-ReemNeural'],
  'ar-YE': ['ar-YE-MaryamNeural', 'ar-YE-SalehNeural'],
  'az-AZ': ['az-AZ-BabekNeural', 'az-AZ-BanuNeural'],
  'bg-BG': ['bg-BG-BorislavNeural', 'bg-BG-KalinaNeural'],
  'bn-BD': ['bn-BD-NabanitaNeural', 'bn-BD-PradeepNeural'],
  'bn-IN': ['bn-IN-BashkarNeural', 'bn-IN-TanishaaNeural'],
  'bs-BA': ['bs-BA-GoranNeural', 'bs-BA-VesnaNeural'],
  'ca-ES': ['ca-ES-EnricNeural', 'ca-ES-JoanaNeural'],
  'cs-CZ': ['cs-CZ-AntoninNeural', 'cs-CZ-VlastaNeural'],
  'cy-GB': ['cy-GB-AledNeural', 'cy-GB-NiaNeural'],
  'da-DK': ['da-DK-ChristelNeural', 'da-DK-JeppeNeural'],
  'de-AT': ['de-AT-IngridNeural', 'de-AT-JonasNeural'],
  'de-CH': ['de-CH-JanNeural', 'de-CH-LeniNeural'],
  'de-DE': [
    'de-DE-AmalaNeural',
    'de-DE-ConradNeural',
    'de-DE-FlorianMultilingualNeural',
    'de-DE-KatjaNeural',
    'de-DE-KillianNeural',
    'de-DE-SeraphinaMultilingualNeural',
  ],
  'el-GR': ['el-GR-AthinaNeural', 'el-GR-NestorasNeural'],
  'en-AU': ['en-AU-NatashaNeural', 'en-AU-WilliamNeural'],
  'en-CA': ['en-CA-ClaraNeural', 'en-CA-LiamNeural'],
  'en-GB': [
    'en-GB-LibbyNeural',
    'en-GB-MaisieNeural',
    'en-GB-RyanNeural',
    'en-GB-SoniaNeural',
    'en-GB-ThomasNeural',
  ],
  'en-HK': ['en-HK-SamNeural', 'en-HK-YanNeural'],
  'en-IE': ['en-IE-ConnorNeural', 'en-IE-EmilyNeural'],
  'en-IN': ['en-IN-NeerjaExpressiveNeural', 'en-IN-NeerjaNeural', 'en-IN-PrabhatNeural'],
  'en-KE': ['en-KE-AsiliaNeural', 'en-KE-ChilembaNeural'],
  'en-NG': ['en-NG-AbeoNeural', 'en-NG-EzinneNeural'],
  'en-NZ': ['en-NZ-MitchellNeural', 'en-NZ-MollyNeural'],
  'en-PH': ['en-PH-JamesNeural', 'en-PH-RosaNeural'],
  'en-SG': ['en-SG-LunaNeural', 'en-SG-WayneNeural'],
  'en-TZ': ['en-TZ-ElimuNeural', 'en-TZ-ImaniNeural'],
  'en-US': [
    'en-US-AnaNeural',
    'en-US-AndrewMultilingualNeural',
    'en-US-AndrewNeural',
    'en-US-AriaNeural',
    'en-US-AvaMultilingualNeural',
    'en-US-AvaNeural',
    'en-US-BrianMultilingualNeural',
    'en-US-BrianNeural',
    'en-US-ChristopherNeural',
    'en-US-EmmaMultilingualNeural',
    'en-US-EmmaNeural',
    'en-US-EricNeural',
    'en-US-GuyNeural',
    'en-US-JennyNeural',
    'en-US-MichelleNeural',
    'en-US-RogerNeural',
    'en-US-SteffanNeural',
  ],
  'es-AR': ['es-AR-ElenaNeural', 'es-AR-TomasNeural'],
  'es-BO': ['es-BO-MarceloNeural', 'es-BO-SofiaNeural'],
  'es-CL': ['es-CL-CatalinaNeural', 'es-CL-LorenzoNeural'],
  'es-CO': ['es-CO-GonzaloNeural', 'es-CO-SalomeNeural'],
  'es-CR': ['es-CR-JuanNeural', 'es-CR-MariaNeural'],
  'es-CU': ['es-CU-BelkysNeural', 'es-CU-ManuelNeural'],
  'es-DO': ['es-DO-EmilioNeural', 'es-DO-RamonaNeural'],
  'es-EC': ['es-EC-AndreaNeural', 'es-EC-LuisNeural'],
  'es-ES': ['es-ES-AlvaroNeural', 'es-ES-ElviraNeural', 'es-ES-XimenaNeural'],
  'es-US': ['es-US-AlonsoNeural', 'es-US-PalomaNeural'],
  'fr-BE': ['fr-BE-CharlineNeural', 'fr-BE-GerardNeural'],
  'fr-CA': ['fr-CA-AntoineNeural', 'fr-CA-JeanNeural', 'fr-CA-SylvieNeural', 'fr-CA-ThierryNeural'],
  'fr-CH': ['fr-CH-ArianeNeural', 'fr-CH-FabriceNeural'],
  'fr-FR': [
    'fr-FR-DeniseNeural',
    'fr-FR-EloiseNeural',
    'fr-FR-HenriNeural',
    'fr-FR-RemyMultilingualNeural',
    'fr-FR-VivienneMultilingualNeural',
  ],
  'ja-JP': ['ja-JP-KeitaNeural', 'ja-JP-NanamiNeural'],
  'ko-KR': ['ko-KR-HyunsuMultilingualNeural', 'ko-KR-InJoonNeural', 'ko-KR-SunHiNeural'],
  'pt-BR': ['pt-BR-AntonioNeural', 'pt-BR-FranciscaNeural', 'pt-BR-ThalitaMultilingualNeural'],
  'pt-PT': ['pt-PT-DuarteNeural', 'pt-PT-RaquelNeural'],
  'zh-CN': [
    'zh-CN-XiaoxiaoNeural',
    'zh-CN-XiaoyiNeural',
    'zh-CN-YunjianNeural',
    'zh-CN-YunxiNeural',
    'zh-CN-YunxiaNeural',
    'zh-CN-YunyangNeural',
    'zh-CN-liaoning-XiaobeiNeural',
    'zh-CN-shaanxi-XiaoniNeural',
  ],
  'zh-HK': ['zh-HK-HiuGaaiNeural', 'zh-HK-HiuMaanNeural', 'zh-HK-WanLungNeural'],
  'zh-TW': ['zh-TW-HsiaoChenNeural', 'zh-TW-HsiaoYuNeural', 'zh-TW-YunJheNeural'],
};

/**
 * Generates a structured list of voices from the EDGE_TTS_VOICES object.
 * @param voices - An object containing voice IDs categorized by language code.
 */
const genVoiceList = (voices: Record<string, string[]>) => {
  return Object.entries(voices).flatMap(([lang, voices]) => {
    return voices.map((id) => {
      const name = id.replace(`${lang}-`, '').replace('Neural', '');
      return { name, id, lang };
    });
  });
};

// Define the structure of the payload required for interacting with the Edge TTS service.
export interface EdgeTTSPayload {
  lang: string;
  text: string;
  voice: string;
  rate: number;
  pitch?: number;
}

/**
 * Creates a hash of the EdgeTTSPayload object.
 *
 * This function is used to generate a unique identifier for a specific TTS request,
 * which can then be used for caching purposes. It converts the payload to a JSON string
 * and then calculates its MD5 hash.
 *
 * @param payload - The EdgeTTSPayload object to hash.
 * @returns The MD5 hash of the payload.
 */
const hashPayload = (payload: EdgeTTSPayload): string => {
  const base = JSON.stringify(payload);
  return md5(base);
};

/**
 * Manages the interaction with the Edge Text-to-Speech (TTS) service.
 *
 * This class handles the generation of speech from text using the Edge TTS service.
 * It supports various languages and voices, and includes caching for efficient use.
 */
export class EdgeSpeechTTS {
  //  An array of available voices
  static voices = genVoiceList(EDGE_TTS_VOICES);
  // Cache for storing audio data
  private static audioCache = new LRUCache<string, ArrayBuffer>(200);

  constructor() {}

    /**
   * Establishes a WebSocket connection with the Edge Speech service to synthesize speech.
   *
   * This private method handles the low-level communication with the Edge Speech service.
   * It formats the request, manages the WebSocket connection, and handles the streaming
   * of the audio data.
   *
   * @param payload - The EdgeTTSPayload containing the text, voice, and other synthesis parameters.
   * @returns A Promise resolving to a Response object containing the audio data.
   */
  async #fetchEdgeSpeechWs({ lang, text, voice, rate }: EdgeTTSPayload): Promise<Response> {
    // Generates a unique connection ID for the WebSocket connection.
    const connectId = randomMd5();
    // Constructs the full URL for the WebSocket connection, including the connection ID and API token.
    const url = `${EDGE_SPEECH_URL}?ConnectionId=${connectId}&TrustedClientToken=${EDGE_API_TOKEN}`;
    const date = new Date().toString();
    const configHeaders = {
      'Content-Type': 'application/json; charset=utf-8',
      Path: 'speech.config',
      'X-Timestamp': date,
    };
    const contentHeaders = {
      'Content-Type': 'application/ssml+xml',
      Path: 'ssml',
      'X-RequestId': connectId,
      'X-Timestamp': date,
    };
    const configContent = JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: true },
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
          },
        },
      },
    });

    /**
     * Generates SSML markup for text-to-speech synthesis.
     * @param lang - The language of the text.
     * @param text - The text to synthesize.
     * @param voice - The voice to use for synthesis.
     * @param rate - The speaking rate.
     */
    const genSSML = (lang: string, text: string, voice: string, rate: number) => {
      return `
        <speak version="1.0" xml:lang="${lang}">
          <voice name="${voice}">
            <prosody rate="${rate}">
              ${text}
            </prosody>
          </voice>
        </speak>
      `;
    };

    /**
     * Formats headers and content for sending over the WebSocket.
     * @param headerObj - The headers as a key-value object.
     * @param content - The content to send.
     */
    const genSendContent = (headerObj: Record<string, string>, content: string) => {
      let header = '';
      for (const key of Object.keys(headerObj)) {
        header += `${key}: ${headerObj[key]}\r\n`;
      }
      return `${header}\r\n${content}`;
    };

    /**
     * Parses a message received from the WebSocket to extract headers and body.
     * @param message - The raw message string received.
     * @returns An object containing the extracted headers and body.
     */
    const getHeadersAndData = (message: string) => {
      const lines = message.split('\n');
      const headers: Record<string, string> = {};
      let body = '';
      let lineIdx = 0;

      for (lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]!.trim();
        if (!line) break;
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) continue;
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        headers[key] = value;
      }

      for (lineIdx = lineIdx + 1; lineIdx < lines.length; lineIdx++) {
        body += lines[lineIdx] + '\n';
      }

      return { headers, body };
    };

    // Generates the SSML and content for the request.
    const ssml = genSSML(lang, text, voice, rate);
    const content = genSendContent(contentHeaders, ssml);
    const config = genSendContent(configHeaders, configContent);

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      // Initialize audioData as an empty ArrayBuffer
      let audioData = new ArrayBuffer(0);

        // Event listener for when the WebSocket connection is established.
      ws.addEventListener('open', () => {
        // Sends the configuration and content to the Edge Speech service.
        ws.send(config);
        // Sends the SSML content to the WebSocket server.
        ws.send(content);
      });

      ws.addEventListener('message', (event: MessageEvent) => {
        if (typeof event.data === 'string') {
          const { headers } = getHeadersAndData(event.data);
          if (headers['Path'] === 'turn.end') {
            // Closes the WebSocket connection.
            ws.close();
             // Rejects the Promise if no audio data has been received.
            if (!audioData.byteLength) {
              return reject(new Error('No audio data received.'));
            }
            // Creates a Response object with the accumulated audio data.
            const res = new Response(audioData);
            resolve(res);
          }
        } else if (event.data instanceof ArrayBuffer) {
          const dataView = new DataView(event.data);
          const headerLength = dataView.getInt16(0);
             // Appends new audio data to the accumulated audioData.
          if (event.data.byteLength > headerLength + 2) {
            const newBody = event.data.slice(2 + headerLength);
            const merged = new Uint8Array(audioData.byteLength + newBody.byteLength);
            merged.set(new Uint8Array(audioData), 0);
            merged.set(new Uint8Array(newBody), audioData.byteLength);
            audioData = merged.buffer;
          }
        }
      });

      ws.addEventListener('error', () => {
        ws.close();
        reject(new Error('WebSocket error occurred.'));
      });
     });
  }

    /**
   * Synthesizes speech based on the provided payload using the Edge TTS service.
   * @param payload - The EdgeTTSPayload object containing synthesis parameters.
   * @returns A Promise resolving to a Response object containing the audio data.
   */
  async create(payload: EdgeTTSPayload): Promise<Response> {
    return this.#fetchEdgeSpeechWs(payload);
  }

   /**
   * Creates an audio Blob from the provided payload, using cached data if available.
   *
   * This method first checks if the audio data for the given payload is cached.
   * If it is, it returns a new Blob from the cached data. Otherwise, it fetches
   * the audio data from the Edge TTS service, caches it, and then returns a Blob.
   * @param payload - The EdgeTTSPayload object containing synthesis parameters.
   * @returns A Promise resolving to an audio Blob.
   */
  async createAudio(payload: EdgeTTSPayload): Promise<Blob> {
      const cacheKey = hashPayload(payload);
    if (EdgeSpeechTTS.audioCache.has(cacheKey)) {
      return new Blob([EdgeSpeechTTS.audioCache.get(cacheKey)!], { type: 'audio/mpeg' });
    }
    try {
      const res = await this.create(payload);
      const arrayBuffer = await res.arrayBuffer();
      EdgeSpeechTTS.audioCache.set(cacheKey, arrayBuffer);
      return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    } catch (error) {
      throw error;
    }
  }
}