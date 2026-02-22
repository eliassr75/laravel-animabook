<?php

namespace App\Integrations\Jikan;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class JikanHttpClient
{
    public function __construct(
        ?string $baseUrl = null,
        ?int $timeoutSeconds = null,
        ?int $retryTimes = null,
        ?int $retrySleepMs = null,
        ?string $userAgent = null,
        ?array $headers = null,
        ?int $maxConcurrency = null,
        ?int $lockTtl = null,
        ?int $lockWaitMs = null,
        ?int $minIntervalMs = null,
        ?int $rateLockTtl = null,
    ) {
        $config = config('jikan');

        $this->baseUrl = $baseUrl ?? $config['base_url'];
        $this->timeoutSeconds = $timeoutSeconds ?? $config['timeout'];
        $this->retryTimes = $retryTimes ?? $config['retry_times'];
        $this->retrySleepMs = $retrySleepMs ?? $config['retry_sleep_ms'];
        $this->userAgent = $userAgent ?? $config['user_agent'];
        $this->headers = $headers ?? $config['headers'];
        $this->maxConcurrency = $maxConcurrency ?? $config['max_concurrency'];
        $this->lockTtl = $lockTtl ?? $config['lock_ttl'];
        $this->lockWaitMs = $lockWaitMs ?? $config['lock_wait_ms'];
        $this->minIntervalMs = $minIntervalMs ?? $config['min_interval_ms'];
        $this->rateLockTtl = $rateLockTtl ?? $config['rate_lock_ttl'];
    }

    private string $baseUrl;
    private int $timeoutSeconds;
    private int $retryTimes;
    private int $retrySleepMs;
    private string $userAgent;
    private array $headers;
    private int $maxConcurrency;
    private int $lockTtl;
    private int $lockWaitMs;
    private int $minIntervalMs;
    private int $rateLockTtl;

    public function get(string $path, array $query = []): Response
    {
        $request = $this->baseRequest();

        return $this->sendWithRetry(fn () => $request->get($this->url($path), $query), $path, $query);
    }

    private function baseRequest(): PendingRequest
    {
        return Http::timeout($this->timeoutSeconds)
            ->acceptJson()
            ->withHeaders($this->headers)
            ->withUserAgent($this->userAgent);
    }

    private function url(string $path): string
    {
        return rtrim($this->baseUrl, '/').'/'.ltrim($path, '/');
    }

    private function sendWithRetry(callable $fn, string $path, array $query): Response
    {
        $attempts = max(1, $this->retryTimes + 1);
        $lastException = null;

        for ($attempt = 1; $attempt <= $attempts; $attempt++) {
            $lock = $this->acquireSlot();
            try {
                $this->enforceRateLimit();
                $response = $fn();

                if (! $this->shouldRetryResponse($response) || $attempt === $attempts) {
                    $this->releaseSlot($lock);
                    return $response;
                }
            } catch (Throwable $e) {
                $lastException = $e;
                $this->releaseSlot($lock);

                if ($attempt === $attempts) {
                    Log::warning('Jikan request failed', [
                        'path' => $path,
                        'query' => $query,
                        'error' => $e->getMessage(),
                    ]);

                    throw $e;
                }
            }

            $this->releaseSlot($lock);
            $this->sleepWithBackoff($attempt);
        }

        if ($lastException) {
            throw $lastException;
        }

        return $fn();
    }

    private function shouldRetryResponse(Response $response): bool
    {
        $status = $response->status();

        return $status === 429 || $status >= 500;
    }

    private function sleepWithBackoff(int $attempt): void
    {
        $base = $this->retrySleepMs;
        $jitter = random_int(0, 200);
        $delayMs = (int) ($base * (2 ** max(0, $attempt - 1)) + $jitter);

        usleep($delayMs * 1000);
    }

    private function acquireSlot()
    {
        if ($this->maxConcurrency <= 0) {
            return null;
        }

        $start = microtime(true);
        $slotCount = max(1, $this->maxConcurrency);

        do {
            for ($i = 0; $i < $slotCount; $i++) {
                $lock = Cache::lock("jikan:slot:{$i}", $this->lockTtl);
                if ($lock->get()) {
                    return $lock;
                }
            }
            usleep(100000);
        } while (((microtime(true) - $start) * 1000) < $this->lockWaitMs);

        Log::debug('Jikan concurrency slot not acquired within wait window', [
            'max_concurrency' => $this->maxConcurrency,
            'lock_wait_ms' => $this->lockWaitMs,
        ]);

        return null;
    }

    private function releaseSlot($lock): void
    {
        if ($lock) {
            try {
                $lock->release();
            } catch (Throwable $e) {
                Log::debug('Failed to release Jikan lock', ['error' => $e->getMessage()]);
            }
        }
    }

    private function enforceRateLimit(): void
    {
        if ($this->minIntervalMs <= 0) {
            return;
        }

        $lock = Cache::lock('jikan:rate', $this->rateLockTtl);
        if (! $lock->get()) {
            usleep($this->minIntervalMs * 1000);
            return;
        }

        try {
            $last = Cache::get('jikan:last_request_ms', 0);
            $now = (int) (microtime(true) * 1000);
            $elapsed = $now - (int) $last;

            if ($elapsed < $this->minIntervalMs) {
                usleep(($this->minIntervalMs - $elapsed) * 1000);
                $now = (int) (microtime(true) * 1000);
            }

            Cache::put('jikan:last_request_ms', $now, $this->rateLockTtl);
        } finally {
            $lock->release();
        }
    }
}
