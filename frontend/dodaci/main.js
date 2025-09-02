// pomoćna funkcija za fetch API
const api = (url, options = {}) =>
  fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }).then(res => {
    if (!res.ok) throw new Error('Greška u API-ju');

    if (res.status === 204) return null; 
    return res.json();
  });

// elementi
const form = document.getElementById('form-hranjenje');
const tbody = document.getElementById('tbody');

// formatiranje datuma
const fmt = iso => new Date(iso).toLocaleString('hr-HR');

// ispis tablice
function ispisiTablicu(podaci) {
  tbody.innerHTML = '';

  for (let h of podaci) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.vrsta_zivotinje}</td>
      <td>${h.vrsta_hrane}</td>
      <td>${h.kolicina_hrane} kg</td>
      <td>${fmt(h.vrijeme_hranjenja)}</td>
      <td>
        <button class="btn btn-sm btn-warning me-2" onclick="popuniFormu(${h.id})">Uredi</button>
        <button class="btn btn-sm btn-danger" onclick="obrisiHranjenje(${h.id})">Obriši</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// dohvaćanje i prikaz svih hranjenja
async function osvjeziTablicu() {
  const hranjenja = await api('/api/hranjenja');
  ispisiTablicu(hranjenja);
}

// dodavanje ili uređivanje hranjenja
form.addEventListener('submit', async e => {
  e.preventDefault();

  const id = document.getElementById('id').value;

  const novo = {
    vrsta_zivotinje: document.getElementById('vrsta_zivotinje').value,
    vrsta_hrane: document.getElementById('vrsta_hrane').value,
    kolicina_hrane: parseFloat(
      document.getElementById('kolicina_hrane').value.replace(',', '.')
    ),
    vrijeme_hranjenja: document.getElementById('vrijeme_hranjenja').value,
  };

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/hranjenja/${id}` : '/api/hranjenja';

    await api(url, {
      method,
      body: JSON.stringify(novo),
    });

    form.reset();
    await osvjeziTablicu();
    prikaziGraf()
  } catch (err) {
    console.error('Greška pri spremanju:', err);
    alert('Greška pri spremanju hranjenja.');
  }
});

// brisanje hranjenja
async function obrisiHranjenje(id) {
  if (!confirm('Jeste li sigurni da želite obrisati ovo hranjenje?')) return;

  try {
    await api(`/api/hranjenja/${id}`, { method: 'DELETE' });
    await osvjeziTablicu();
    prikaziGraf()
    
  } catch (err) {
    console.error('Greška pri brisanju:', err);
    alert('Greška pri brisanju hranjenja.');
  }
}

// popunjavanje forme za uređivanje
async function popuniFormu(id) {
  try {
    const h = await api(`/api/hranjenja/${id}`);
    document.getElementById('id').value = h.id;
    document.getElementById('vrsta_zivotinje').value = h.vrsta_zivotinje;
    document.getElementById('vrsta_hrane').value = h.vrsta_hrane;
    document.getElementById('kolicina_hrane').value = h.kolicina_hrane;
    document.getElementById('vrijeme_hranjenja').value = h.vrijeme_hranjenja.slice(0, 16);
  } catch (err) {
    console.error('Greška pri dohvaćanju podataka:', err);
    alert('Greška pri dohvaćanju hranjenja.');
  }
}

// filtriranje 
async function filtriraj() {
  const filterVrsta = document.getElementById('filter_vrsta').value.toLowerCase();
  const filterHrana = document.getElementById('filter_hrana').value.toLowerCase();
  const filterDatumOd = document.getElementById('filter_datum_od').value;
  const filterDatumDo = document.getElementById('filter_datum_do').value;

  const hranjenja = await api('/api/hranjenja');

  const filtrirana = hranjenja.filter(h => {
    const datum = h.vrijeme_hranjenja.slice(0, 10); // format datuma: YYYY-MM-DD

    const uvjeti = [
      h.vrsta_zivotinje.toLowerCase().includes(filterVrsta),
      h.vrsta_hrane.toLowerCase().includes(filterHrana),
      !filterDatumOd || datum >= filterDatumOd,
      !filterDatumDo || datum <= filterDatumDo
    ];

    return uvjeti.every(Boolean);
  });

  ispisiTablicu(filtrirana);
}

// poništavanje filtera
function resetFiltra() {
  document.getElementById('filter_vrsta').value = '';
  document.getElementById('filter_hrana').value = '';
  document.getElementById('filter_datum_od').value = '';
  document.getElementById('filter_datum_do').value = '';
  osvjeziTablicu();
}

// pokretanje nakon učitavanja stranice
window.addEventListener('DOMContentLoaded', () => {
  osvjeziTablicu();
  prikaziGraf()
});

async function prikaziGraf() {
  const hranjenja = await api('/api/hranjenja');

  const agregirano = {};

  for (let h of hranjenja) {
    const vrsta = h.vrsta_zivotinje;
    agregirano[vrsta] = (agregirano[vrsta] || 0) + h.kolicina_hrane;
  }

  const labels = Object.keys(agregirano);
  const podaci = Object.values(agregirano);

  const ctx = document.getElementById('chartHrana').getContext('2d');

  // uklanjanje ako postoji prijašnji graf 
  if (window.grafHrane) window.grafHrane.destroy();

  window.grafHrane = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ukupno hrane (kg)',
        data: podaci,
        backgroundColor: '#198754'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
