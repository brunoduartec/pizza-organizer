import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header';
import NomeAlert from './components/NomeAlert';
import ItemTable from './components/ItemTable';
import NomeInput from './components/NomeInput';

const API_URL = process.env.REACT_APP_API_URL || '__API_URL__';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState(localStorage.getItem("nome") || "");

  useEffect(() => {
    if (!nome) return;
    fetch(`${API_URL}/items`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      });
  }, [nome]);

  const handleLevar = (item) => {
    fetch(`${API_URL}/items/${encodeURIComponent(item)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quemVaiLevar: [nome] }),
    }).then(() => {
      const updated = items.map(i => i.item === item ? {
        ...i,
        quemVaiLevar: [...(i.quemVaiLevar || []), nome]
      } : i);
      setItems(updated);
    });
  };

  const handleDesistir = (item) => {
    fetch(`${API_URL}/items/${encodeURIComponent(item)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remover: nome }),
    }).then(() => {
      const updated = items.map(i => i.item === item ? {
        ...i,
        quemVaiLevar: (i.quemVaiLevar || []).filter(n => n !== nome)
      } : i);
      setItems(updated);
    });
  };

  if (!nome) {
    return (
      <div className="container py-4">
        <Header />
        <NomeInput onSave={setNome} />
      </div>
    );
  }

  if (loading) {
    return <div className="container text-center py-5"><p>Carregando...</p></div>;
  }

  return (
    <main className="container py-4">
      <Header />
      <NomeAlert nome={nome} />
      <ItemTable
        items={items}
        nome={nome}
        onLevar={handleLevar}
        onDesistir={handleDesistir}
      />
    </main>
  );
}

export default App;