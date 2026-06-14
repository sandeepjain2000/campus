const STEP_COUNT = 7;

/**
 * @param {{ flows: { name: string, steps: string[] }[], intro?: string }} props
 */
export default function UseCasesTable({ flows, intro }) {
  return (
    <>
      {intro ? (
        <p className="dev-notes-detail" style={{ marginTop: 0 }}>
          {intro}
        </p>
      ) : null}
      <div className="dev-notes-table-wrap dev-notes-table-wrap--wide">
        <table className="dev-notes-table dev-notes-table--use-cases">
          <thead>
            <tr>
              <th scope="col">Use case</th>
              {Array.from({ length: STEP_COUNT }, (_, i) => (
                <th key={i} scope="col">
                  Step {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                {Array.from({ length: STEP_COUNT }, (_, i) => (
                  <td key={i} className={row.steps[i] ? '' : 'dev-notes-muted'}>
                    {row.steps[i] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
