from pony.orm import Database, Required, PrimaryKey
from datetime import datetime

# db.sqlite - DB Browswer otvara file
db = Database()
db.bind(provider='sqlite', filename='db.sqlite', create_db=True)

class Hranjenje(db.Entity):
    _table_ = 'hranjenje'
    id = PrimaryKey(int, auto=True)
    vrsta_zivotinje = Required(str)
    vrsta_hrane = Required(str)
    kolicina_hrane = Required(float)
    vrijeme_hranjenja = Required(datetime)
    datum_unosa = Required(datetime, default=lambda: datetime.utcnow())

db.generate_mapping(create_tables=True)
