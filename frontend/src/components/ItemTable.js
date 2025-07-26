// frontend/src/components/ItemTable.js
import ItemRow from './ItemRow';

export default function ItemTable({ items, nome, onLevar, onDesistir }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-dark text-center">
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Unidade</th>
                <th>Quem vai levar</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <ItemRow
                  key={item.item}
                  item={item}
                  nome={nome}
                  onLevar={onLevar}
                  onDesistir={onDesistir}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}