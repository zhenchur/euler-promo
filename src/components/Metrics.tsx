import './Metrics.css';

const metrics = [
  { value: '20', label: 'Лет опыта в каждом обзоре' },
  { value: '40', label: 'Аналитиков в команде' },
  { value: '2500+', label: 'Обзоров за 2025 год' },
  { value: '>15%', label: 'Средняя альфа по топ-40 идей' },
  { value: '100+', label: 'Инвестиционных идей сгенерировано' },
];

export function Metrics() {
  return (
    <section
      className="metrics-section white-panel"
      id="metrics"
      aria-labelledby="metrics-heading"
      data-node-id="3303:152"
    >
      <h2 className="metrics-heading" id="metrics-heading">
        Почему мы лучшие
      </h2>

      <ul className="metrics-list" role="list">
        {metrics.map(({ value, label }) => (
          <li className="metrics-item" key={value}>
            <div className="metrics-row">
              <p className="metrics-value">{value}</p>
              <p className="metrics-label">{label}</p>
            </div>
            <div className="metrics-line" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}assets/5d373.svg`} width="1164" height="1" alt="" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Metrics;
