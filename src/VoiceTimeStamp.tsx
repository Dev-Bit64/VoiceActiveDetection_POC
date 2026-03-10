import { useEffect, useRef, useState } from "react";

type EventItem = {
  source: "Microphone" | "Speaker";
  start: number;
  end: number;
};

export default function VoiceTimelinePOC() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [conversationRunning, setConversationRunning] = useState(false);
  const [micRunning, setMicRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  const startTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const micSpeakingRef = useRef(false);
  const micStartRef = useRef(0);

  const speakerStartRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const timerRef = useRef<any>(null);
  const rafRef = useRef<number>(0);

  const getTime = () =>
    Number(((performance.now() - startTimeRef.current) / 1000).toFixed(2));

  const addEvent = (
    source: "Microphone" | "Speaker",
    start: number,
    end: number
  ) => {
    setEvents((prev) => [...prev, { source, start, end }]);
  };

  /* ---------------- CONVERSATION ---------------- */

  const startConversation = () => {
    startTimeRef.current = performance.now();
    setConversationRunning(true);
    setEvents([]);
    setTimer(0);

    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopConversation = () => {
    setConversationRunning(false);

    cancelAnimationFrame(rafRef.current!);
    clearInterval(timerRef.current);

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();

    audioRef.current?.pause();
    setMicRunning(false);
  };

  /* ---------------- MIC CONTROL ---------------- */

  const startMic = async () => {
    if (!conversationRunning || micRunning) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    micStreamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 512;

    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const detect = () => {
      analyser.getByteFrequencyData(data);

      const volume =
        data.reduce((a, b) => a + b, 0) / analyser.frequencyBinCount;

      const speaking = volume > 20;

      if (speaking && !micSpeakingRef.current) {
        micSpeakingRef.current = true;
        micStartRef.current = getTime();
      }

      if (!speaking && micSpeakingRef.current) {
        micSpeakingRef.current = false;
        addEvent("Microphone", micStartRef.current, getTime());
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    detect();
    setMicRunning(true);
  };

  const stopMic = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    cancelAnimationFrame(rafRef.current!);

    setMicRunning(false);
  };

  /* ---------------- SPEAKER ---------------- */

  const startSpeaker = () => {
    if (!audioRef.current || !conversationRunning) return;

    speakerStartRef.current = getTime();
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const stopSpeaker = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    addEvent("Speaker", speakerStartRef.current, getTime());
  };

  const handleSpeakerEnded = () => {
    addEvent("Speaker", speakerStartRef.current, getTime());
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current!);
      clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{ padding: 30 }}>
      <h2>Voice Timeline POC</h2>

      {/* Conversation */}

      <div>
        <button onClick={startConversation} disabled={conversationRunning}>
          Start Conversation
        </button>

        <button onClick={stopConversation} disabled={!conversationRunning}>
          Stop Conversation
        </button>

        <span style={{ marginLeft: 20 }}>Timer: {timer}s</span>
      </div>

      <br />

      {/* Mic */}

      <button onClick={startMic} disabled={!conversationRunning || micRunning}>
        Start Mic
      </button>

      <button onClick={stopMic} disabled={!micRunning}>
        Stop Mic
      </button>

      <br />
      <br />

      {/* Speaker */}

      <button onClick={startSpeaker}>Start Speaker</button>

      <button onClick={stopSpeaker}>Stop Speaker</button>

      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onEnded={handleSpeakerEnded}
      />

      <h3>Conversation Timeline</h3>

      <ul>
        {events.map((e, i) => (
          <li key={i}>
            {e.source}: {e.start}s - {e.end}s
          </li>
        ))}
      </ul>
    </div>
  );
}