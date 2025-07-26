// frontend/src/components/NomeAlert.js
export default function NomeAlert({ nome }) {
  return nome ? (
    <div className="alert alert-success text-center">
      Olá <strong>{nome}</strong>! Escolha o que você vai levar:
    </div>
  ) : (
    <div className="alert alert-warning text-center">
      Por favor, defina seu nome com: <code>localStorage.setItem("nome", "SeuNome")</code>
    </div>
  );
}