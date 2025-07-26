// frontend/src/components/ItemRow.js
export default function ItemRow({ item, nome, onLevar, onDesistir }) {
  const { item: nomeItem, quantidade, unidade, quemVaiLevar = [] } = item;

  return (
    <tr>
      <td>{nomeItem}</td>
      <td className="text-center">{quantidade}</td>
      <td className="text-center">{unidade}</td>
      <td>{quemVaiLevar.join(', ')}</td>
      <td className="text-center">
        {quemVaiLevar.includes(nome) && (
          <button className="btn btn-outline-danger btn-sm w-100" onClick={() => onDesistir(nomeItem)}>
            Desistir
          </button>
        )}
        {!quemVaiLevar.includes(nome) && quemVaiLevar.length < quantidade && (
          <button className="btn btn-outline-success btn-sm w-100" onClick={() => onLevar(nomeItem)}>
            Levar
          </button>
        )}
      </td>
    </tr>
  );
}