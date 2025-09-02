from flask import Flask, request, jsonify, send_from_directory
from pony.orm import db_session, select
from datetime import datetime, timezone
from models import Hranjenje
import os
from pony.orm.serialization import to_dict
from flask import send_from_directory



app = Flask(__name__, static_folder=None)

def to_dict(h):
    return {
        'id': h.id,
        'vrsta_zivotinje': h.vrsta_zivotinje,
        'vrsta_hrane': h.vrsta_hrane,
        'kolicina_hrane': h.kolicina_hrane,
        'vrijeme_hranjenja': h.vrijeme_hranjenja.isoformat(),
        'datum_unosa': h.datum_unosa.isoformat(),
    }

@app.get('/api/hranjenja')
@db_session
def list_hranjenja():

    data = [to_dict(h) for h in list(Hranjenje.select().order_by(lambda h: h.vrijeme_hranjenja))]

    return jsonify(data)



@app.post('/api/hranjenja')
@db_session
def create_hranjenje():
    payload = request.get_json(force=True)
    h = Hranjenje(
        vrsta_zivotinje=payload['vrsta_zivotinje'],
        vrsta_hrane=payload['vrsta_hrane'],
        kolicina_hrane=float(payload['kolicina_hrane']),
        vrijeme_hranjenja=datetime.fromisoformat(payload['vrijeme_hranjenja']),
        datum_unosa = datetime.now(timezone.utc),
    )
    return jsonify(to_dict(h)), 201

@app.put('/api/hranjenja/<int:id>')
@db_session
def update_hranjenje(id):
    h = Hranjenje.get(id=id)
    if not h:
        return jsonify({'error': 'Hranjenje nije pronađeno'}), 404

    payload = request.get_json(force=True)
    h.vrsta_zivotinje = payload['vrsta_zivotinje']
    h.vrsta_hrane = payload['vrsta_hrane']
    h.kolicina_hrane = float(payload['kolicina_hrane'])
    h.vrijeme_hranjenja = datetime.fromisoformat(payload['vrijeme_hranjenja'])
    return jsonify({'message': 'Uspješno ažurirano'})

@app.get('/api/hranjenja/<int:id>')
@db_session
def get_hranjenje(id):
    h = Hranjenje.get(id=id)
    if not h:
        return jsonify({'error': 'Nema hranjenja'}), 404
    return jsonify(to_dict(h))


@app.delete('/api/hranjenja/<int:id>')
@db_session
def delete_hranjenje(id):
    h = Hranjenje.get(id=id)
    if h:
        h.delete()
        return '', 204
    return jsonify({'error': 'Hranjenje nije pronađeno'}), 404


@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'index.html')

@app.route('/dodaci/<path:path>')
def serve_assets(path):
    return send_from_directory('../frontend/dodaci', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)


# da se u dockeru frontend dio i backend dio vide
@app.route('/')
def root():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path) #u dockerfile dodan path


#notes to me:
# Running on all addresses (0.0.0.0) - 
# Running on http://127.0.0.1:8000 - moje računalo
# Running on http://192.168.100.22:8000 - svi uređaji na mojoj mreži
