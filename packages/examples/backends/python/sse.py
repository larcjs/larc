#!/usr/bin/env python3
"""
SSE Hub for PAN (Python/Flask version)

Simple SSE hub for PAN: GET streams events; POST appends and broadcasts.
- GET /sse?topics=topic1,topic2&lastEventId=123
- POST /sse  { "topic": "demo.ping", "data": { ... }, "retain": false }

Config: file-backed queue under ./.rt

Usage: python sse.py [port]
Default port: 3003
"""

import sys
import os
import json
import time
import re
from pathlib import Path
from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS

app = Flask(__name__)

# CORS configuration
CORS(app, supports_credentials=True, origins=[
    'https://cdr2.com',
    'https://www.cdr2.com',
    'https://localhost:8443',
    'http://localhost:8080',
    'http://localhost:*'
])

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3003

# Runtime directory
RT_DIR = Path(__file__).parent / '.rt'
SEQ_FILE = RT_DIR / 'seq.txt'
LOG_FILE = RT_DIR / 'pan-events.ndjson'

# Ensure runtime dir exists
RT_DIR.mkdir(exist_ok=True)
if not SEQ_FILE.exists():
    SEQ_FILE.write_text('0\n')
if not LOG_FILE.exists():
    LOG_FILE.touch()

# Get next event ID
def get_next_id():
    try:
        seq = int(SEQ_FILE.read_text().strip() or '0')
        next_id = seq + 1
        SEQ_FILE.write_text(f'{next_id}\n')
        return next_id
    except:
        # Fallback: read last ID from log
        try:
            content = LOG_FILE.read_text()
            lines = [l for l in content.strip().split('\n') if l]
            if lines:
                last_line = lines[-1]
                rec = json.loads(last_line)
                return rec.get('id', 0) + 1
        except:
            pass
        return 1

# Append event to log
def append_event(topic, data, retain=False):
    try:
        event_id = get_next_id()
        rec = {
            'id': event_id,
            'ts': int(time.time()),
            'topic': topic,
            'data': data
        }

        if retain:
            rec['retain'] = True

        line = json.dumps(rec) + '\n'

        with open(LOG_FILE, 'a') as f:
            f.write(line)

        return {'ok': True, 'id': event_id}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

# Check if topic matches patterns
def topic_matches(topic, patterns):
    if not patterns:
        return True

    for pattern in patterns:
        if not pattern or pattern == '' or pattern == '*':
            return True

        # Convert PAN wildcard ("*" for single token) to regex
        regex = re.escape(pattern).replace(r'\*', '[^.]+')
        if re.match(f'^{regex}$', topic):
            return True

    return False

# Read events from log file
def read_events(last_id=None, patterns=None):
    try:
        content = LOG_FILE.read_text()
        lines = [l for l in content.strip().split('\n') if l]
        events = []

        for line in lines:
            try:
                rec = json.loads(line)
                if last_id is not None and rec.get('id', 0) <= last_id:
                    continue
                if not topic_matches(rec.get('topic', ''), patterns or []):
                    continue
                events.append(rec)
            except:
                continue

        return events
    except:
        return []

# Format SSE event
def format_sse_event(rec):
    event_id = rec.get('id', 0)
    topic = rec.get('topic', '')
    data = rec.get('data')
    retain = rec.get('retain', False)

    if not topic:
        return ''

    payload = {'topic': topic, 'data': data}
    if retain:
        payload['retain'] = True

    return f'id: {event_id}\nevent: {topic}\ndata: {json.dumps(payload)}\n\n'

# POST handler - append event
@app.route('/', methods=['POST'])
def handle_post():
    try:
        data = request.get_json() or {}

        if not data.get('topic'):
            return {'ok': False, 'error': 'invalid-payload: require {topic, data?}'}, 400

        topic = data['topic']
        event_data = data.get('data')
        retain = data.get('retain', False)

        result = append_event(topic, event_data, retain)

        if result['ok']:
            return result, 200
        else:
            return result, 500
    except Exception as e:
        # Log full error internally, return generic message to client
        import logging
        logging.exception('Error handling POST request')
        return {'ok': False, 'error': 'Internal server error'}, 500

# GET handler - SSE stream
@app.route('/', methods=['GET'])
def handle_get():
    topics_raw = request.args.get('topics', '')
    patterns = [p.strip() for p in re.split(r'[,\s]+', topics_raw) if p.strip()]

    last_id = request.args.get('lastEventId')
    if last_id:
        last_id = int(last_id)
    else:
        # Check Last-Event-ID header
        last_event_id_header = request.headers.get('Last-Event-ID')
        if last_event_id_header:
            last_id = int(last_event_id_header)

    def generate():
        # Send past events
        past_events = read_events(last_id, patterns)
        for rec in past_events:
            yield format_sse_event(rec)

        # Tail the file for new events
        last_pos = LOG_FILE.stat().st_size
        deadline = time.time() + 300  # 5 minutes

        while time.time() < deadline:
            try:
                current_size = LOG_FILE.stat().st_size

                if current_size < last_pos:
                    # File was truncated/rotated
                    last_pos = 0

                if current_size > last_pos:
                    with open(LOG_FILE, 'r') as f:
                        f.seek(last_pos)
                        new_lines = f.read()
                        last_pos = f.tell()

                    for line in new_lines.strip().split('\n'):
                        if not line:
                            continue
                        try:
                            rec = json.loads(line)
                            if topic_matches(rec.get('topic', ''), patterns):
                                yield format_sse_event(rec)
                        except:
                            continue
                else:
                    # Keepalive
                    yield ': keepalive\n\n'
                    time.sleep(15)

            except GeneratorExit:
                break
            except:
                time.sleep(0.3)

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

if __name__ == '__main__':
    print(f'SSE server running on http://localhost:{PORT}')
    print(f'Event log: {LOG_FILE}')
    print('GET /?topics=topic1,topic2&lastEventId=123')
    print('POST / with { "topic": "demo.ping", "data": {...}, "retain": false }')
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
