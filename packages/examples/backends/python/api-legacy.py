#!/usr/bin/env python3
"""
Legacy API Server for PAN (Python/Flask version)
Simple database API with list_resources, get, and list_fields operations

Usage: python api-legacy.py [port]
Default port: 3000
"""

import sys
import configparser
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import sqlite3

app = Flask(__name__)
CORS(app)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

# Load environment from .env file
def load_environment(file_path):
    config = configparser.ConfigParser()
    try:
        config.read(file_path)
        return config
    except Exception as e:
        print(f"Error loading .env: {e}")
        return None

env = load_environment('.env')

# Database connection
DB_TYPE = env.get('db', 'type', fallback='mysql')
db_conn = None

def get_db():
    global db_conn
    if db_conn is None:
        if DB_TYPE == 'sqlite':
            db_file = env.get('db', 'file', fallback='pan_demo.db')
            db_conn = sqlite3.connect(db_file, check_same_thread=False)
            db_conn.row_factory = sqlite3.Row
        else:
            db_conn = mysql.connector.connect(
                host=env.get('db', 'host', fallback='localhost'),
                user=env.get('db', 'user', fallback='root'),
                password=env.get('db', 'pass', fallback=''),
                database=env.get('db', 'db', fallback='test')
            )
    return db_conn

# Get operation - retrieve data from a table
def get_data(params):
    page_size = min(int(params.get('page_size', 20)), 20)

    if not params.get('rsc'):
        return {'status': 'error', 'msg': 'Missing resource name'}

    rsc = params['rsc']
    fields = params.get('fields', '*')

    try:
        db = get_db()
        cursor = db.cursor()

        if params.get('id'):
            # Single record by ID
            pk = f"{rsc}ID"
            if DB_TYPE == 'sqlite':
                sql = f"SELECT {fields} FROM {rsc} WHERE {pk} = ?"
                cursor.execute(sql, (params['id'],))
                row = cursor.fetchone()
                return [dict(row)] if row else []
            else:
                sql = f"SELECT {fields} FROM {rsc} WHERE {pk} = %s"
                cursor.execute(sql, (params['id'],))
                columns = [desc[0] for desc in cursor.description]
                row = cursor.fetchone()
                return [dict(zip(columns, row))] if row else []
        else:
            # List with pagination
            start = int(params.get('start', 0))
            where = ''
            where_params = []

            if params.get('filters'):
                try:
                    filters = json.loads(params['filters'])
                    if isinstance(filters, list) and len(filters) > 0:
                        wheres = []
                        for f in filters:
                            wheres.append(f"{f['key']} LIKE ?")
                            where_params.append(f"%{f['value']}%")
                        where = ' WHERE ' + ' AND '.join(wheres)
                except:
                    pass

            # Count total
            if DB_TYPE == 'sqlite':
                count_sql = f"SELECT COUNT(*) as total FROM {rsc} {where}"
                cursor.execute(count_sql, where_params)
                total = cursor.fetchone()[0]

                # Get paginated results
                sql = f"SELECT {fields} FROM {rsc} {where} LIMIT ? OFFSET ?"
                cursor.execute(sql, where_params + [page_size, start])
                rows = cursor.fetchall()
                results = [dict(row) for row in rows]
            else:
                count_sql = f"SELECT COUNT(*) as total FROM {rsc} {where}"
                cursor.execute(count_sql, tuple(where_params))
                total = cursor.fetchone()[0]

                # Get paginated results
                sql = f"SELECT {fields} FROM {rsc} {where} LIMIT %s OFFSET %s"
                cursor.execute(sql, tuple(where_params + [page_size, start]))
                columns = [desc[0] for desc in cursor.description]
                rows = cursor.fetchall()
                results = [dict(zip(columns, row)) for row in rows]

            return {
                'total': total,
                'start': start,
                'count': len(results),
                'pages': (total + page_size - 1) // page_size,
                'page': start // page_size + 1,
                'results': results
            }
    except Exception as e:
        return {'status': 'error', 'msg': str(e)}

# List resources - show available tables
def list_resources(params):
    try:
        db = get_db()
        cursor = db.cursor()

        if DB_TYPE == 'sqlite':
            sql = "SELECT name FROM sqlite_master WHERE type='table'"
            if params.get('filter'):
                sql += f" AND name LIKE ?"
                cursor.execute(sql, (f"%{params['filter']}%",))
            else:
                cursor.execute(sql)
        else:
            sql = "SHOW TABLES"
            if params.get('filter'):
                sql += " LIKE %s"
                cursor.execute(sql, (f"%{params['filter']}%",))
            else:
                cursor.execute(sql)

        rows = cursor.fetchall()
        tables = [row[0] for row in rows]
        return {'Resources': tables}
    except Exception as e:
        return {'status': 'error', 'msg': str(e)}

# List fields - describe table structure
def list_fields(params):
    if not params.get('rsc') or params['rsc'] == '':
        return {'status': 'error', 'msg': 'Missing rsc'}

    try:
        rsc = params['rsc']
        db = get_db()
        cursor = db.cursor()

        fields = []
        pk = None

        if DB_TYPE == 'sqlite':
            sql = f"PRAGMA table_info({rsc})"
            cursor.execute(sql)
            rows = cursor.fetchall()

            for row in rows:
                fields.append({
                    'Field': row[1],
                    'Type': row[2],
                    'Null': 'YES' if not row[3] else 'NO',
                    'Key': 'PRI' if row[5] else '',
                    'Default': row[4],
                    'Extra': ''
                })
                if row[5] and pk is None:
                    pk = row[1]
        else:
            sql = f"SHOW COLUMNS FROM {rsc}"
            cursor.execute(sql)
            rows = cursor.fetchall()

            for row in rows:
                fields.append({
                    'Field': row[0],
                    'Type': row[1],
                    'Null': row[2],
                    'Key': row[3],
                    'Default': row[4],
                    'Extra': row[5]
                })
                if row[3] == 'PRI' and pk is None:
                    pk = row[0]

        # Fallback to conventional <Table>ID if no explicit PK found
        if pk is None:
            pk = rsc + 'ID'

        return {'Resource': rsc, 'PrimaryKey': pk, 'Fields': fields}
    except Exception as e:
        return {'status': 'error', 'msg': str(e)}

# Route handler
@app.route('/', methods=['GET', 'POST'])
def handle_request():
    params = request.args.to_dict()
    action = params.get('x', '')

    if action == 'list_resources':
        result = list_resources(params)
    elif action == 'get':
        result = get_data(params)
    elif action == 'list_fields':
        result = list_fields(params)
    elif action:
        result = get_data(params)
    else:
        result = {'status': 'error', 'msg': 'Invalid request'}

    return jsonify(result)

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions without exposing stack traces"""
    # Log the full error internally
    import logging
    logging.exception('Internal server error')
    # Return generic error to client
    return jsonify({'status': 'error', 'msg': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f'Legacy API server running on http://localhost:{PORT}')
    print('Usage: ?x=list_resources | ?x=get&rsc=tablename | ?x=list_fields&rsc=tablename')
    app.run(host='0.0.0.0', port=PORT, debug=False)
