/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from '@jest/globals';
import { gzipResponse, parseCompressedBody } from '../lib/responseCompression';

describe('responseCompression', () => {
    describe('gzipResponse', () => {
        describe('response structure', () => {
            it('returns isBase64Encoded as true', () => {
                const result = gzipResponse({ data: 'test' });
                expect(result.isBase64Encoded).toBe(true);
            });

            it('returns default status code 200', () => {
                const result = gzipResponse({ data: 'test' });
                expect(result.statusCode).toBe(200);
            });

            it('returns custom status code when provided', () => {
                const result = gzipResponse({ data: 'test' }, 201);
                expect(result.statusCode).toBe(201);
            });

            it('returns body as a non-empty string', () => {
                const result = gzipResponse({ data: 'test' });
                expect(typeof result.body).toBe('string');
                expect(result.body.length).toBeGreaterThan(0);
            });
        });

        describe('headers', () => {
            it('sets Content-Type to application/json', () => {
                const result = gzipResponse({ data: 'test' });
                expect(result.headers['Content-Type']).toBe('application/json');
            });

            it('sets Content-Encoding to gzip', () => {
                const result = gzipResponse({ data: 'test' });
                expect(result.headers['Content-Encoding']).toBe('gzip');
            });

            it('sets Vary to Accept-Encoding', () => {
                const result = gzipResponse({ data: 'test' });
                expect(result.headers['Vary']).toBe('Accept-Encoding');
            });

            it('merges custom headers with defaults', () => {
                const customHeaders = { 'X-Custom-Header': 'custom-value' };
                const result = gzipResponse({ data: 'test' }, 200, customHeaders);

                expect(result.headers['X-Custom-Header']).toBe('custom-value');
                expect(result.headers['Content-Encoding']).toBe('gzip');
            });

            it('allows custom headers to override defaults', () => {
                const customHeaders = { 'Content-Type': 'text/plain' };
                const result = gzipResponse('plain text', 200, customHeaders);

                expect(result.headers['Content-Type']).toBe('text/plain');
            });
        });

        describe('payload handling', () => {
            it('handles object payloads', () => {
                const payload = { key: 'value', nested: { a: 1 } };
                const result = gzipResponse(payload);
                const parsed = parseCompressedBody(result);

                expect(parsed).toEqual(payload);
            });

            it('handles array payloads', () => {
                const payload = [{ id: 1 }, { id: 2 }];
                const result = gzipResponse(payload);
                const parsed = parseCompressedBody(result);

                expect(parsed).toEqual(payload);
            });

            it('handles string payloads that are valid JSON', () => {
                const payload = '{"already":"stringified"}';
                const result = gzipResponse(payload);
                const parsed = parseCompressedBody(result);

                expect(parsed).toEqual({ already: 'stringified' });
            });

            it('handles empty object payload', () => {
                const result = gzipResponse({});
                const parsed = parseCompressedBody(result);

                expect(parsed).toEqual({});
            });

            it('handles empty array payload', () => {
                const result = gzipResponse([]);
                const parsed = parseCompressedBody(result);

                expect(parsed).toEqual([]);
            });

            it('returns raw string for compressed text/plain payloads', () => {
                const payload = 'plain text payload';
                const result = gzipResponse(payload, 200, { 'Content-Type': 'text/plain' });
                const parsed = parseCompressedBody<string>(result);

                expect(parsed).toBe(payload);
            });

            it('returns raw string for uncompressed text/plain payloads', () => {
                const payload = 'plain text payload';
                const response = {
                    body: payload,
                    headers: { 'Content-Type': 'text/plain' },
                };

                const parsed = parseCompressedBody<string>(response);
                expect(parsed).toBe(payload);
            });
        });
    });

    describe('parseCompressedBody', () => {
        it('decompresses gzipped response correctly', () => {
            const original = { games: [{ id: '1', name: 'Test Game' }] };
            const compressed = gzipResponse(original);
            const result = parseCompressedBody(compressed);

            expect(result).toEqual(original);
        });

        it('handles lower-cased content-encoding header', () => {
            const original = { games: [{ id: '1', name: 'Test Game' }] };
            const compressed = gzipResponse(original);
            const lowerCased = {
                ...compressed,
                headers: {
                    'content-encoding': compressed.headers['Content-Encoding'],
                    'content-type': compressed.headers['Content-Type'],
                } as Record<string, string>,
            };

            const result = parseCompressedBody(lowerCased);
            expect(result).toEqual(original);
        });

        it('handles non-compressed JSON response', () => {
            const response = {
                body: JSON.stringify({ data: 'uncompressed' }),
                isBase64Encoded: false,
                headers: { 'Content-Type': 'application/json' },
            };
            const result = parseCompressedBody(response);

            expect(result).toEqual({ data: 'uncompressed' });
        });

        it('handles response without isBase64Encoded flag', () => {
            const response = {
                body: JSON.stringify({ data: 'test' }),
                headers: { 'Content-Type': 'application/json' },
            };
            const result = parseCompressedBody(response);

            expect(result).toEqual({ data: 'test' });
        });

        it('preserves data types through compression round-trip', () => {
            const original = {
                string: 'text',
                number: 42,
                float: 3.14,
                boolean: true,
                nullValue: null,
                array: [1, 2, 3],
                nested: { deep: { value: 'found' } },
            };
            const compressed = gzipResponse(original);
            const result = parseCompressedBody(compressed);

            expect(result).toEqual(original);
        });

        it('handles large payloads', () => {
            const largePayload = {
                games: Array.from({ length: 100 }, (_, i) => ({
                    id: `game-${i}`,
                    name: `Game ${i}`,
                    description: 'A'.repeat(100),
                })),
            };
            const compressed = gzipResponse(largePayload);
            const result = parseCompressedBody(compressed);

            expect(result).toEqual(largePayload);
        });
    });
});
