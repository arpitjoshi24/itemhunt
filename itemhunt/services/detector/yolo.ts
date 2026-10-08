import { decodeAndNms, type Detection } from "./postprocess";

const MODEL_URL = "/models/yolo11n.onnx";
const SIZE = 640;

type Ort = typeof import("onnxruntime-web");
type Session = import("onnxruntime-web").InferenceSession;

let ortModule: Ort | null = null;
let session: Session | null = null;
let loading: Promise<void> | null = null;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let inputBuffer: Float32Array | null = null;

export function isModelLoaded(): boolean {
  return session !== null;
}

/** Loads the model once. Safe to call many times. */
export function loadModel(): Promise<void> {
  if (session) return Promise.resolve();
  if (!loading) {
    loading = (async () => {
      const ort = await import("onnxruntime-web");
      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = 1; // no special server headers needed
      const s = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });
      ortModule = ort;
      session = s;
    })().catch((err) => {
      loading = null; // allow a retry
      throw err;
    });
  }
  return loading;
}

function getCanvas() {
  if (!canvas || !ctx) {
    canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    inputBuffer = new Float32Array(3 * SIZE * SIZE);
  }
  return { ctx: ctx!, input: inputBuffer! };
}

export async function detect(video: HTMLVideoElement): Promise<Detection[]> {
  if (!session || !ortModule) throw new Error("Model not loaded");

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return [];

  const { ctx, input } = getCanvas();

  // letterbox: fit the video inside 640x640 without stretching
  const scale = Math.min(SIZE / vw, SIZE / vh);
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);
  const dx = Math.floor((SIZE - w) / 2);
  const dy = Math.floor((SIZE - h) / 2);

  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(video, dx, dy, w, h);

  // RGBA pixels -> planar RGB float32 in 0..1
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
  const plane = SIZE * SIZE;
  for (let i = 0; i < plane; i++) {
    input[i] = data[i * 4] / 255;
    input[plane + i] = data[i * 4 + 1] / 255;
    input[2 * plane + i] = data[i * 4 + 2] / 255;
  }

  const tensor = new ortModule.Tensor("float32", input, [1, 3, SIZE, SIZE]);
  const results = await session.run({ [session.inputNames[0]]: tensor });
  const out = results[session.outputNames[0]];

  return decodeAndNms(out.data as Float32Array, out.dims as number[]);
}