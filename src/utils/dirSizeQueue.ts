import { invoke } from "@tauri-apps/api/core";

class ConcurrencyQueue {
  private max: number;
  private active = 0;
  private q: Array<{ gen: number; fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }>; 
  private generation = 0;

  constructor(max: number) {
    this.max = max;
    this.q = [];
  }

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const gen = this.generation;
    return new Promise<T>((resolve, reject) => {
      this.q.push({ gen, fn: fn as any, resolve, reject });
      this.run();
    });
  }

  cancelAll(reason: any = new Error("dirSizeQueue: cancelled")) {
    // Invalidate all pending jobs and clear queue
    this.generation++;
    const q = this.q.splice(0, this.q.length);
    for (const item of q) {
      try { item.reject(reason); } catch {}
    }
  }

  private run() {
    while (this.active < this.max && this.q.length > 0) {
      const item = this.q.shift()!;
      // Drop job if generation was invalidated before it started
      if (item.gen !== this.generation) {
        item.reject(new Error("dirSizeQueue: stale job dropped"));
        continue;
      }
      this.active++;
      item.fn()
        .then((v) => {
          // Ignore result if generation changed mid-flight
          if (item.gen === this.generation) item.resolve(v);
          else item.reject(new Error("dirSizeQueue: stale result"));
        })
        .catch((e) => item.reject(e))
        .finally(() => {
          this.active--;
          this.run();
        });
    }
  }
}

const dirSizeLimiter = new ConcurrencyQueue(2);

export function requestDirSize(path: string): Promise<void> {
  return dirSizeLimiter.enqueue(() => invoke<void>("get_dir_size", { path }));
}

export async function cancelAllDirSizeJobs() {
  // Cancel frontend queue immediately
  dirSizeLimiter.cancelAll();
  // Ask backend to abort heavy walkers
  try {
    await invoke("cancel_dir_size_jobs");
  } catch {
    // ignore
  }
}
