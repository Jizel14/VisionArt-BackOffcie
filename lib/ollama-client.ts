type OllamaGenerateResponse = {
  response: string;
  total_duration?: number;
  load_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "visionart-sql";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60_000);

export async function ollamaGenerateSql(params: {
  question: string;
  previousOutput?: string;
  previousError?: string;
}): Promise<string> {
  const correction =
    params.previousOutput != null
      ? ` Previous output was invalid: ${params.previousOutput} Error: ${params.previousError ?? ""} Return corrected SQL only.`
      : "";

  const prompt = `Question: ${params.question}.${correction}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);
  const t0 = Date.now();

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        keep_alive: "30m",
        options: { temperature: 0, num_predict: 200, top_p: 0.1 },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama error: HTTP ${res.status}`);
    }

    const data = (await res.json()) as OllamaGenerateResponse;
    const elapsed = Date.now() - t0;
    const loadMs = Math.round((data.load_duration || 0) / 1e6);
    const evalMs = Math.round((data.eval_duration || 0) / 1e6);
    console.log(
      `[OLLAMA] elapsed=${elapsed}ms load=${loadMs}ms eval=${evalMs}ms tokens=${data.eval_count || 0}`
    );
    return (data?.response || "").trim();
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") {
      throw new Error(`Ollama timeout after ${OLLAMA_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
