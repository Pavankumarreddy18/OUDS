const fs = require('fs');
const path = require('path');

module.exports = function(stats) {
  const total = stats.passes + stats.failures;
  const passRate = total > 0 ? Math.round((stats.passes / total) * 100) : 0;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mega Web E2E Test Execution Report</title>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #121212; color: #e0e0e0; margin: 0; padding: 20px; }
    h1 { color: #ffffff; text-align: center; }
    .summary { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #1e1e1e; border-radius: 8px; }
    .badge { padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 1.2em; }
    .pass { background: #28a745; color: white; }
    .fail { background: #dc3545; color: white; }
    .total { background: #007bff; color: white; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 12px; text-align: left; }
    th { background-color: #252525; color: #fff; }
    tr:nth-child(even) { background-color: #1a1a1a; }
    tr:hover { background-color: #2a2a2a; }
    .status-pass { color: #4caf50; font-weight: bold; }
    .status-fail { color: #f44336; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Mega Web E2E Test Execution Report</h1>
  <div class="summary">
    <div class="badge total">Total Tests: ${total}</div>
    <div class="badge pass">Passes: ${stats.passes}</div>
    <div class="badge fail">Failures: ${stats.failures}</div>
    <div class="badge ${passRate === 100 ? 'pass' : 'fail'}">Pass Rate: ${passRate}%</div>
  </div>
  
  <h2>Detailed Results</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Test Case</th>
        <th>Duration (ms)</th>
        <th>Status</th>
        <th>Error</th>
      </tr>
    </thead>
    <tbody>
      ${stats.tests.map(t => `
        <tr>
          <td>${t.category}</td>
          <td>${t.title}</td>
          <td>${t.duration}</td>
          <td class="status-${t.status.toLowerCase()}">${t.status}</td>
          <td>${t.errorMsg || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const htmlDir = path.join(__dirname, '..', 'Test_Results', 'HTML');
  if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir, { recursive: true });
  }

  const htmlPath = path.join(htmlDir, 'execution-report.html');
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`HTML report saved to ${htmlPath}`);
};
