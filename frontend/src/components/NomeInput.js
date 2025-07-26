import { useState, useEffect } from 'react';

export default function NomeInput({ onSave }) {
  const [nome, setNome] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    const nomeSalvo = localStorage.getItem("nome");
    if (nomeSalvo) {
      setNome(nomeSalvo);
      setSalvo(true);
      onSave(nomeSalvo);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    localStorage.setItem("nome", nome.trim());
    setSalvo(true);
    onSave(nome.trim());
  };

  const handleTrocar = () => {
    localStorage.removeItem("nome");
    setNome("");
    setSalvo(false);
  };

  if (salvo) {
    return (
      <div className="mb-4 d-flex align-items-center gap-3">
        <span className="fw-bold">Olá, {nome}!</span>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleTrocar}>
          Trocar nome
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 d-flex align-items-center gap-2">
      <label htmlFor="nome" className="form-label mb-0">Digite seu nome:</label>
      <input
        type="text"
        id="nome"
        className="form-control"
        style={{ maxWidth: 200 }}
        value={nome}
        onChange={e => setNome(e.target.value)}
      />
      <button className="btn btn-primary" type="submit">Entrar</button>
    </form>
  );
}