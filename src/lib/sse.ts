/**
 * sse.js - A flexible EventSource polyfill/replacement.
 * https://github.com/mpetazzoni/sse.js
 *
 * Copyright (C) 2016-2024 Maxime Petazzoni <maxime.petazzoni@bulix.org>.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

interface SSEHeaders {
    [key: string]: string;
}

interface SSEOptions {
    headers?: SSEHeaders;
    payload?: string;
    method?: string;
    withCredentials?: boolean;
    start?: boolean;
    debug?: boolean;
}

interface SSEvent extends CustomEvent {
    id?: string | null;
    data?: string;
    lastEventId?: string;
    responseCode?: number;
    headers?: Record<string, string[]>;
    source?: any;
}

interface ReadyStateEvent extends CustomEvent {
    readyState: number;
}

class SSE {
    public static INITIALIZING: number = -1;
    public static CONNECTING: number = 0;
    public static OPEN: number = 1;
    public static CLOSED: number = 2;

    public url: string;
    public headers: SSEHeaders;
    public payload: string;
    public method: string;
    public withCredentials: boolean;
    public debug: boolean;
    public FIELD_SEPARATOR: string;
    public listeners: Record<string, EventListener[]>;
    public xhr: XMLHttpRequest | null;
    public readyState: number;
    public progress: number;
    public chunk: string;
    public lastEventId: string;

    // Event handlers
    public onmessage?: (event: SSEvent) => void;
    public onopen?: (event: SSEvent) => void;
    public onload?: (event: SSEvent) => void;
    public onreadystatechange?: (event: ReadyStateEvent) => void;
    public onerror?: (event: SSEvent) => void;
    public onabort?: (event: SSEvent) => void;

    constructor(url: string, options?: SSEOptions) {
        this.url = url;

        options = options || {};
        this.headers = options.headers || {};
        this.payload = options.payload !== undefined ? options.payload : '';
        this.method = options.method || (this.payload && 'POST' || 'GET');
        this.withCredentials = !!options.withCredentials;
        this.debug = !!options.debug;
        this.FIELD_SEPARATOR = ':';
        this.listeners = {};
        this.xhr = null;
        this.readyState = SSE.INITIALIZING;
        this.progress = 0;
        this.chunk = '';
        this.lastEventId = '';

        if (options.start === undefined || options.start) {
            this.stream();
        }
    }

    addEventListener(type: string, listener: EventListener): void {
        if (this.listeners[type] === undefined) {
            this.listeners[type] = [];
        }

        if (this.listeners[type].indexOf(listener) === -1) {
            this.listeners[type].push(listener);
        }
    }

    removeEventListener(type: string, listener: EventListener): void {
        if (this.listeners[type] === undefined) {
            return;
        }

        const filtered: EventListener[] = [];
        this.listeners[type].forEach(function (element) {
            if (element !== listener) {
                filtered.push(element);
            }
        });
        if (filtered.length === 0) {
            delete this.listeners[type];
        } else {
            this.listeners[type] = filtered;
        }
    }

    dispatchEvent(e: Event | SSEvent | CustomEvent): boolean {
        if (!e) {
            return true;
        }

        if (this.debug) {
            console.debug(e);
        }

        (e as SSEvent).source = this;

        const onHandler = 'on' + e.type as keyof SSE;
        if (this[onHandler] && typeof this[onHandler] === 'function') {
            (this[onHandler] as Function).call(this, e);
            if (e.defaultPrevented) {
                return false;
            }
        }

        if (this.listeners[e.type]) {
            return this.listeners[e.type].every(function (callback) {
                callback(e);
                return !e.defaultPrevented;
            });
        }

        return true;
    }

    private _markClosed(): void {
        this.xhr = null;
        this.progress = 0;
        this.chunk = '';
        this._setReadyState(SSE.CLOSED);
    }

    private _setReadyState(state: number): void {
        const event = new CustomEvent('readystatechange') as ReadyStateEvent;
        event.readyState = state;
        this.readyState = state;
        this.dispatchEvent(event);
    }

    private _onStreamFailure(e: Event): void {
        const event = new CustomEvent('error') as SSEvent;
        const target = e.target as XMLHttpRequest;
        event.responseCode = target?.status;
        event.data = target?.response;
        this.dispatchEvent(event);
        this._markClosed();
    }

    private _onStreamAbort(): void {
        this.dispatchEvent(new CustomEvent('abort'));
        this._markClosed();
    }

    private _onStreamProgress(e: Event): void {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.status < 200 || this.xhr.status >= 300) {
            this._onStreamFailure(e);
            return;
        }

        const data = this.xhr.responseText.substring(this.progress);
        this.progress += data.length;

        const parts = (this.chunk + data).split(/(\r\n\r\n|\r\r|\n\n)/g);

        /*
         * We assume that the last chunk can be incomplete because of buffering or other network effects,
         * so we always save the last part to merge it with the next incoming packet
         */
        const lastPart = parts.pop() || '';
        parts.forEach((part) => {
            if (part.trim().length > 0) {
                this.dispatchEvent(this._parseEventChunk(part));
            }
        });
        this.chunk = lastPart;
    }

    private _onStreamLoaded(e: Event): void {
        this._onStreamProgress(e);

        // Parse the last chunk.
        this.dispatchEvent(this._parseEventChunk(this.chunk));
        this.chunk = '';

        this._markClosed();
    }

    private _parseEventChunk(chunk: string): SSEvent | null {
        if (!chunk || chunk.length === 0) {
            return null;
        }

        if (this.debug) {
            console.debug(chunk);
        }

        const e = { 'id': null, 'retry': null, 'data': null, 'event': null };
        chunk.split(/\n|\r\n|\r/).forEach((line) => {
            const index = line.indexOf(this.FIELD_SEPARATOR);
            let field, value;
            if (index > 0) {
                // only first whitespace should be trimmed
                const skip = (line[index + 1] === ' ') ? 2 : 1;
                field = line.substring(0, index);
                value = line.substring(index + skip);
            } else if (index < 0) {
                // Interpret the entire line as the field name, and use the empty string as the field value
                field = line;
                value = '';
            } else {
                // A colon is the first character. This is a comment; ignore it.
                return;
            }

            if (!(field in e)) {
                return;
            }

            // consecutive 'data' is concatenated with newlines
            if (field === 'data' && e[field] !== null) {
                e['data'] += "\n" + value;
            } else {
                e[field] = value;
            }
        });

        if (e.id !== null) {
            this.lastEventId = e.id;
        }

        const event = new CustomEvent(e.event || 'message') as SSEvent;
        event.id = e.id;
        event.data = e.data || '';
        event.lastEventId = this.lastEventId;
        return event;
    }

    private _onReadyStateChange(): void {
        if (!this.xhr) {
            return;
        }

        if (this.xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            const headers: Record<string, string[]> = {};
            const headerPairs = this.xhr.getAllResponseHeaders().trim().split('\r\n');
            for (const headerPair of headerPairs) {
                const [key, ...valueParts] = headerPair.split(':');
                const value = valueParts.join(':').trim();
                // Ensure the header value is always an array
                headers[key.trim().toLowerCase()] = headers[key.trim().toLowerCase()] || [];
                headers[key.trim().toLowerCase()].push(value);
            }

            const event = new CustomEvent('open') as SSEvent;
            event.responseCode = this.xhr.status;
            event.headers = headers;
            this.dispatchEvent(event);
            this._setReadyState(SSE.OPEN);
        }
    }

    stream(): void {
        if (this.xhr) {
            // Already connected.
            return;
        }

        this._setReadyState(SSE.CONNECTING);

        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('progress', this._onStreamProgress.bind(this));
        this.xhr.addEventListener('load', this._onStreamLoaded.bind(this));
        this.xhr.addEventListener('readystatechange', this._onReadyStateChange.bind(this));
        this.xhr.addEventListener('error', this._onStreamFailure.bind(this));
        this.xhr.addEventListener('abort', this._onStreamAbort.bind(this));
        this.xhr.open(this.method, this.url);
        for (let header in this.headers) {
            this.xhr.setRequestHeader(header, this.headers[header]);
        }
        if (this.lastEventId.length > 0) {
            this.xhr.setRequestHeader("Last-Event-ID", this.lastEventId);
        }
        this.xhr.withCredentials = this.withCredentials;
        this.xhr.send(this.payload);
    }

    close(): void {
        if (this.readyState === SSE.CLOSED) {
            return;
        }

        this.xhr?.abort();
    }
}

// Export as an ECMAScript module
export { SSE };